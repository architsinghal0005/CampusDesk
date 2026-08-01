import cron from 'node-cron';
import prisma from '../prisma.js';
import { sendCampusDeskMail } from './mail.js';

const REMINDER_LOOKAHEAD_MINUTES = 60;
const REMINDER_WINDOW_MINUTES = 1;

let cronStarted = false;
let isRunning = false;

function floorToMinute(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0);
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function markExpiredApprovedBookingsAsCompleted(now: Date) {
  const result = await prisma.booking.updateMany({
    where: {
      status: 'APPROVED',
      endTime: {
        lt: now
      }
    },
    data: {
      status: 'COMPLETED'
    }
  });

  if (result.count > 0) {
    console.log(`Marked ${result.count} expired booking(s) as completed`);
  }
}

async function sendBookingReminders(now: Date) {
  const reminderStart = floorToMinute(new Date(now.getTime() + REMINDER_LOOKAHEAD_MINUTES * 60 * 1000));
  const reminderEnd = new Date(reminderStart.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

  const dueBookings = await prisma.booking.findMany({
    where: {
      status: 'APPROVED',
      reminderSentAt: null,
      startTime: {
        gte: reminderStart,
        lt: reminderEnd
      }
    },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      resource: {
        select: {
          name: true,
          location: true
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  });

  for (const booking of dueBookings) {
    const claimed = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        reminderSentAt: null
      },
      data: {
        reminderSentAt: new Date()
      }
    });

    if (claimed.count === 0) {
      continue;
    }

    const resourceLabel = booking.resource.location
      ? `${booking.resource.name} (${booking.resource.location})`
      : booking.resource.name;

    try {
      await sendCampusDeskMail({
        to: booking.user.email,
        subject: 'CampusDesk booking reminder',
        text: `Hi ${booking.user.name}, your booking for ${resourceLabel} starts at ${formatDateTime(booking.startTime)}.`,
        html: `<p>Hi ${booking.user.name},</p><p>Your booking for <strong>${resourceLabel}</strong> starts at <strong>${formatDateTime(booking.startTime)}</strong>.</p>`
      });

      console.log(`Sent booking reminder for booking ${booking.id}`);
    } catch (error) {
      console.error(`Failed to send booking reminder for booking ${booking.id}:`, error);
    }
  }
}

export async function runBookingMaintenance() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const now = new Date();
    await markExpiredApprovedBookingsAsCompleted(now);
    await sendBookingReminders(now);
  } catch (error) {
    console.error('Error running booking maintenance:', error);
  } finally {
    isRunning = false;
  }
}

export function startBookingCron() {
  if (cronStarted) {
    return;
  }

  cronStarted = true;

  cron.schedule('* * * * *', () => {
    void runBookingMaintenance();
  });
}