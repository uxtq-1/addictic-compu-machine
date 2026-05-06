import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AppError) {
    logger.warn('Operational error', { message: error.message, statusCode: error.statusCode });
    res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  // Unhandled errors
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
