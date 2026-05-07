import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { expressValidator } from './middleware/validation';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { auditLogMiddleware } from './middleware/auditLog';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { db } from './utils/database';

// Routes (will be created)
// import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';

const app: Express = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Input validation middleware
app.use(expressValidator);

// Audit logging middleware (for mutations)
app.use(auditLogMiddleware);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Auth routes (public)
// app.use('/auth', authRoutes);

// Protected routes (require JWT)
// app.use('/products', authMiddleware, productRoutes);
app.use('/products', optionalAuthMiddleware, productRoutes);
app.use('/categories', optionalAuthMiddleware, categoryRoutes);
app.use('/orders', optionalAuthMiddleware, orderRoutes);

// Error handling
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connection successful');

    // Start HTTP server
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
