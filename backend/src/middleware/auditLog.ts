import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function auditLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only log mutations (POST, PUT, DELETE), not reads (GET)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const originalJson = res.json;

    res.json = function (data: any) {
      // Capture response for audit log
      (async () => {
        try {
          const auditEntry = {
            id: uuidv4(),
            user_id: req.userId || 'anonymous',
            action: req.method,
            resource_type: req.path.split('/')[1], // e.g., 'products', 'orders'
            resource_id: req.params.id || null,
            ip_address: req.ip,
            request_path: req.path,
            request_method: req.method,
            response_status: res.statusCode,
            // Store request body (sanitize passwords/tokens)
            request_body: sanitizeRequestBody(req.body),
            created_at: new Date(),
          };

          await db('audit_logs').insert(auditEntry);
          logger.info('Audit log created', auditEntry);
        } catch (error) {
          logger.error('Failed to create audit log:', error);
          // Don't fail the request if audit logging fails
        }
      })();

      // Call original json method
      return originalJson.call(this, data);
    };
  }

  next();
}

function sanitizeRequestBody(body: any): string {
  if (!body) return '';

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'stripe_key', 'api_key'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return JSON.stringify(sanitized);
}
