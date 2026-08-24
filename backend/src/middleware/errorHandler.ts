import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  logger.error(`[${req.method}] ${req.url} - ${errorCode}: ${message}`, {
    stack: err.stack,
    body: req.body,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  });
}
