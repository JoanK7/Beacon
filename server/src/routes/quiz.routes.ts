import { Router } from 'express';
import * as gamificationService from '../services/gamification.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const bySlug = validate(schemas.slugParam, 'params');
const byId = validate(schemas.idParam, 'params');

// Submit answers for an attempt the server started (declared before /:slug routes).
router.post('/attempts/:id/submit', byId, validate(schemas.quizSubmission), async (req, res) => {
  const { id } = getValid(req, schemas.idParam, 'params');
  const { answers } = getValid(req, schemas.quizSubmission);
  res.json({ result: await gamificationService.submitAttempt(id, currentUser(req).id, answers) });
});

// Overview: best score, attempts so far, how many questions a quiz shows.
router.get('/:slug', bySlug, async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json({ quiz: await gamificationService.getQuiz(slug, currentUser(req).id) });
});

// Start an attempt: the server picks the questions ("new" or "repeat").
router.post('/:slug/attempts', bySlug, validate(schemas.quizAttemptStart), async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  const { mode } = getValid(req, schemas.quizAttemptStart);
  res.status(201).json({ attempt: await gamificationService.startAttempt(slug, currentUser(req).id, mode) });
});

export default router;
