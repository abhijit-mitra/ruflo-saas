import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import orgRoutes from './routes/org.routes';
import projectRoutes from './routes/project.routes';
import quoteRoutes from './routes/quote.routes';
import documentRoutes from './routes/document.routes';
import changeOrderRoutes from './routes/change-order.routes';
import invoiceRoutes from './routes/invoice.routes';
import purchaseOrderRoutes from './routes/purchase-order.routes';
import salesOrderRoutes from './routes/sales-order.routes';

// Initialize passport strategies
import './strategies/local.strategy';
import './strategies/google.strategy';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use(limiter);

// Auth-specific stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/quotes', quoteRoutes);
app.use('/api/projects/:projectId/documents', documentRoutes);
app.use('/api/projects/:projectId/change-orders', changeOrderRoutes);
app.use('/api/projects/:projectId/invoices', invoiceRoutes);
app.use('/api/projects/:projectId/purchase-orders', purchaseOrderRoutes);
app.use('/api/projects/:projectId/sales-orders', salesOrderRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
