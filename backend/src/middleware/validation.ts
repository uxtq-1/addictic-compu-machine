import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export function expressValidator(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add custom validators as route handlers will use express-validator
  next();
}

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation errors', { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  next();
}

// Custom validation functions
export const validators = {
  validateEmail: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    return value;
  },

  validatePrice: (value: number) => {
    if (value < 0 || !Number.isFinite(value)) {
      throw new Error('Price must be a positive number');
    }
    return value;
  },

  validateVAT: (value: number) => {
    if (value < 0 || value > 100) {
      throw new Error('VAT must be between 0 and 100');
    }
    return value;
  },

  validateImage: (file: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!file) {
      throw new Error('Image file required');
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > maxSize) {
      throw new Error('Image must be smaller than 2MB');
    }

    return file;
  },
};
