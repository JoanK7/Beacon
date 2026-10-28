import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

// Express 5 forwards rejected promises from async handlers here automatically.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if ((err as { type?: string })?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  // Unknown errors: log server-side, never leak internals to the client.
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
