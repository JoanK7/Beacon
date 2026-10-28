import { Router } from 'express';
import * as gamificationService from '../services/gamification.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const bySlug = validate(schemas.slugParam, 'params');

router.get('/:slug', bySlug, async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json({ quiz: await gamificationService.getQuiz(slug, currentUser(req).id) });
});

router.post('/:slug/submit', bySlug, validate(schemas.quizSubmission), async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  const { answers } = getValid(req, schemas.quizSubmission);
  res.json({ result: await gamificationService.submitQuiz(slug, currentUser(req).id, answers) });
});

export default router;
