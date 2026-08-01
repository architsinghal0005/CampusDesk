import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../prisma.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

// Operating hours: 8:00 AM to 8:00 PM (08:00 - 20:00)
const OPENING_HOUR = 8;
const CLOSING_HOUR = 20;

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseDateTime(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

// Create a new booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { resourceId, startTime, endTime, purpose } = req.body;

    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    if (!resourceId || !startTime || !endTime) {
      return sendError(res, 400, 'BAD_REQUEST', 'resourceId, startTime, and endTime are required');
    }

    const resourceIdNumber = parsePositiveInteger(resourceId);
    const start = parseDateTime(startTime);
    const end = parseDateTime(endTime);
    const now = new Date();

    if (!resourceIdNumber || !start || !end) {
      return sendError(res, 400, 'BAD_REQUEST', 'resourceId must be a positive integer and startTime/endTime must be valid dates');
    }

    // 1. Rule: startTime must be in future
    if (start <= now) {
      return sendError(res, 400, 'BAD_REQUEST', 'Start time must be in the future');
    }

    // 2. Rule: endTime > startTime
    if (end <= start) {
      return sendError(res, 400, 'BAD_REQUEST', 'End time must be after start time');
    }

    // 3. Rule: Duration 30 min to 4 hours
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30 || durationMinutes > 240) {
      return sendError(res, 400, 'BAD_REQUEST', 'Booking duration must be between 30 minutes and 4 hours');
    }

    // 4. Rule: Inside resource opening hours (8 AM to 8 PM)
    const startHour = start.getHours();
    const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
    if (startHour < OPENING_HOUR || endHour > CLOSING_HOUR || start.getDate() !== end.getDate()) {
      return sendError(res, 400, 'BAD_REQUEST', 'Bookings must be within operating hours (8:00 AM - 8:00 PM on the same day)');
    }

    // Check resource existence and availability
    const resource = await prisma.resource.findUnique({
      where: { id: resourceIdNumber }
    });

    if (!resource) {
      return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    }

    if (!resource.isAvailable) {
      return sendError(res, 409, 'CONFLICT', 'Resource is unavailable');
    }

    // 5. Rule: Maximum 2 upcoming bookings per student per resource
    const upcomingCount = await prisma.booking.count({
      where: {
        userId,
        resourceId: resourceIdNumber,
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { gte: now }
      }
    });

    if (upcomingCount >= 2) {
      return sendError(res, 409, 'CONFLICT', 'Maximum 2 upcoming bookings allowed per student for this resource');
    }

    // 6. & 7. Rule: No overlapping bookings (Strict overlap: start < existing.end AND end > existing.start)
    // Allows back-to-back bookings (e.g. 10:00-11:00 and 11:00-12:00 do NOT overlap)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        resourceId: resourceIdNumber,
        status: { in: ['PENDING', 'APPROVED'] },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    // 8. Rule: Return 409 when conflict occurs with conflicting slot
    if (conflictingBooking) {
      return sendError(res, 409, 'CONFLICT', 'Resource is already booked during the selected time slot', {
        conflictingSlot: {
          id: conflictingBooking.id,
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime
        }
      });
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        userId,
        resourceId: resourceIdNumber,
        startTime: start,
        endTime: end,
        purpose: purpose || null,
        status: 'PENDING'
      }
    });

    return sendSuccess(res, 201, 'Booking created successfully', { booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Get bookings for logged in student or all bookings for admin
export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const where: any = {};
    if (role !== 'ADMIN') {
      where.userId = userId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        resource: {
          select: { name: true, category: true, location: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Cancel a booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { id } = req.params;
    const bookingId = parsePositiveInteger(id);

    if (!bookingId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Booking id must be a positive integer');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return sendError(res, 404, 'NOT_FOUND', 'Booking not found');
    }

    if (role !== 'ADMIN' && booking.userId !== userId) {
      return sendError(res, 403, 'FORBIDDEN', 'You can only cancel your own bookings');
    }

    if (booking.status === 'CANCELLED') {
      return sendError(res, 409, 'CONFLICT', 'Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      return sendError(res, 409, 'CONFLICT', 'Completed bookings cannot be cancelled');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    });

    return sendSuccess(res, 200, 'Booking cancelled successfully', { booking: updated });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};
