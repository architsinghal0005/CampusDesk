import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'JWT secret is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return sendError(res, 403, 'FORBIDDEN', 'Admin access required');
  }
  next();
};
