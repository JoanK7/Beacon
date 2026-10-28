import type { NextFunction, Request, Response } from 'express';
import config from '../config';
import * as authService from '../services/auth.service';
import { unauthorized, forbidden } from '../utils/http-error';
import type { Role } from '../types';

/** Resolve the session cookie (or Bearer token) to a user and attach it as req.user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[config.sessionCookieName] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return next(unauthorized());

  const user = await authService.findUserBySessionToken(token);
  if (!user) return next(unauthorized('Your session has expired. Please sign in again.'));
  req.user = user;
  req.sessionToken = token;
  return next();
}

/** Role-based access control. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

/** The signed-in user. Only call in handlers mounted behind requireAuth. */
export function currentUser(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}
