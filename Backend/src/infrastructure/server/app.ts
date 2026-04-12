import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { setupRoutes } from './routes';

/**
 * Creates and configures the Express application.
 * Business logic and route handlers will be added in adapters/inbound/http.
 */
export function createApp(): Application {
  const app = express();

  // ─── Middleware ──────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── API Routes ──────────────────────────────────────────────
  const apiRouter = setupRoutes();
  app.use('/api/v1', apiRouter);

  // ─── Health Check ───────────────────────────────────────────
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fueleu-maritime-api',
    });
  });

  return app;
}
