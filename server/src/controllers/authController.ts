import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { sendCampusDeskMail } from '../utils/mail.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

// Send OTP to user's email
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'BAD_REQUEST', 'Email is required');
    }

    // Rate limiting: Maximum 3 OTP requests in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentRequests = await prisma.oTP.count({
      where: {
        email,
        createdAt: { gte: tenMinutesAgo }
      }
    });

    if (recentRequests >= 3) {
      return sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many OTP requests. Please try again in 10 minutes.');
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save OTP to database
    await prisma.oTP.create({
      data: {
        email,
        code,
        expiresAt
      }
    });

    const { previewUrl } = await sendCampusDeskMail({
      to: email,
      subject: 'Your CampusDesk Verification Code',
      text: `Your OTP code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your OTP code is <b>${code}</b>. It expires in 5 minutes.</p>`
    });

    console.log('OTP Email Preview URL:', previewUrl);

    return sendSuccess(res, 200, 'OTP sent successfully', { previewUrl });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};

// Verify OTP and return JWT token
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code, name } = req.body;

    if (!email || !code) {
      return sendError(res, 400, 'BAD_REQUEST', 'Email and OTP code are required');
    }

    // Find latest valid non-expired matching OTP
    const validOtp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) {
      return sendError(res, 400, 'BAD_REQUEST', 'Invalid or expired OTP');
    }

    // Delete used OTP (Single-use requirement)
    await prisma.oTP.deleteMany({
      where: { email }
    });

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // Create user if not exists (Default role: STUDENT)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // Password not required for OTP auth
          role: 'STUDENT'
        }
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'JWT secret is not configured');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 200, 'OTP verified successfully', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
  }
};
