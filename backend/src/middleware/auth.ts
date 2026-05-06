import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      cafeteriaId?: string;
      role?: string;
      user?: {
        uid: string;
        email?: string;
        cafeteriaId?: string;
        role?: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;

    // Verify JWT contains cafeteria_id and role (from custom claims or separate JWT)
    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.cafeteriaId = decoded.cafeteriaId;
      req.role = decoded.role;
    } catch (jwtError) {
      logger.warn('JWT verification failed, continuing with Firebase auth only');
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user context
      next();
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;

    // Verify JWT contains cafeteria_id and role (from custom claims or separate JWT)
    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.cafeteriaId = decoded.cafeteriaId;
      req.role = decoded.role;
    } catch (jwtError) {
      logger.warn('JWT verification failed, continuing with Firebase auth only');
    }

    next();
  } catch (error) {
    // Auth failed, but since it's optional, continue without user context
    logger.debug('Optional auth failed, continuing without user context');
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      logger.warn(`Unauthorized access attempt: user ${req.userId} role ${req.role}`);
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}
