import { Response } from 'express';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR';

type ErrorDetails = Record<string, unknown>;

type SuccessBody<T> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorBody = {
  success: false;
  message: string;
  error: {
    code: ErrorCode;
    details?: ErrorDetails;
  };
};

export function sendSuccess<T>(res: Response, status: number, message: string, data?: T) {
  const body: SuccessBody<T> = { success: true, message };

  if (data !== undefined) {
    body.data = data;
  }

  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: ErrorDetails
) {
  const body: ErrorBody = {
    success: false,
    message,
    error: {
      code,
      ...(details ? { details } : {})
    }
  };

  return res.status(status).json(body);
}