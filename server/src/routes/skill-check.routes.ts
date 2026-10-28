import { Router } from 'express';
import * as skillCheckService from '../services/skill-check.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await skillCheckService.getSkillCheck(currentUser(req).id));
});

router.post('/', validate(schemas.skillCheckSubmission), async (req, res) => {
  const { kind, answers } = getValid(req, schemas.skillCheckSubmission);
  res.status(201).json({ result: await skillCheckService.submitSkillCheck(currentUser(req).id, kind, answers) });
});

export default router;
