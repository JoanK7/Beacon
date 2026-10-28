import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';
import * as feedbackService from '../services/feedback.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';

const router = Router();
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.isTest ? 1000 : 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// Sign-in is required to deter spam, but the stored response has no link to the user.
router.post('/', feedbackLimiter, validate(schemas.feedback), async (req, res) => {
  res.status(201).json(await feedbackService.submitFeedback(getValid(req, schemas.feedback)));
});

export default router;
