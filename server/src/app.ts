// Express application factory. Kept separate from index.ts so tests can
// exercise the full HTTP stack without opening a network port.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config';
import * as db from './db/pool';
import { requireAuth, requireRole } from './middleware/auth';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import trainingRoutes from './routes/training.routes';
import quizRoutes from './routes/quiz.routes';
import scenarioRoutes from './routes/scenarios.routes';
import skillCheckRoutes from './routes/skill-check.routes';
import progressRoutes from './routes/progress.routes';
import providersRoutes from './routes/providers.routes';
import sessionsRoutes from './routes/sessions.routes';
import reflectionsRoutes from './routes/reflections.routes';
import feedbackRoutes from './routes/feedback.routes';
import adminRoutes from './routes/admin.routes';
import dashboardRoutes from './routes/dashboard.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', config.trustProxy); // so rate limiting keys on the real client IP
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: [...config.corsOrigins], credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  // Friendly pointer for anyone who opens the API URL in a browser.
  app.get('/', (_req, res) => {
    res.json({ name: 'Beacon API', message: 'This is the API. Open the web app (http://localhost:3000 in development).', health: '/api/health' });
  });

  // Health check for uptime monitoring (NFR4) and Render's health probe.
  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Peer-facing routes are open to every signed-in role so admins and
  // coordinators can preview exactly what peer supporters see.
  app.use('/api/auth', authRoutes);
  app.use('/api/modules', requireAuth, trainingRoutes);
  app.use('/api/quiz', requireAuth, quizRoutes);
  app.use('/api/scenarios', requireAuth, scenarioRoutes);
  app.use('/api/skill-check', requireAuth, skillCheckRoutes);
  app.use('/api/progress', requireAuth, progressRoutes);
  app.use('/api/providers', requireAuth, providersRoutes);
  app.use('/api/sessions', requireAuth, sessionsRoutes);
  app.use('/api/reflections', requireAuth, reflectionsRoutes);
  app.use('/api/feedback', requireAuth, feedbackRoutes);
  app.use('/api/admin', requireAuth, requireRole('admin'), adminRoutes);
  app.use('/api/dashboard', requireAuth, requireRole('coordinator', 'admin'), dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
