import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';
import * as authService from '../services/auth.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { requireAuth, currentUser } from '../middleware/auth';

const router = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true, // not readable by JavaScript, so XSS cannot steal it
    secure: config.isProduction,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  const { user, token, expiresAt } = await authService.register(getValid(req, schemas.register));
  setSessionCookie(res, token, expiresAt);
  res.status(201).json({ user });
});

router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  const { user, token, expiresAt } = await authService.login(getValid(req, schemas.login));
  setSessionCookie(res, token, expiresAt);
  res.json({ user });
});

router.post('/logout', requireAuth, async (req, res) => {
  if (req.sessionToken) await authService.logout(req.sessionToken);
  res.clearCookie(config.sessionCookieName, { path: '/' });
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});

// Right to erasure: deletes the account and everything linked to it.
router.delete('/me', requireAuth, async (req, res) => {
  await authService.deleteAccount(currentUser(req).id);
  res.clearCookie(config.sessionCookieName, { path: '/' });
  res.status(204).end();
});

export default router;
