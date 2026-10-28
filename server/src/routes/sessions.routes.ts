import { Router } from 'express';
import * as referralService from '../services/referral.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ sessions: await referralService.listSessions(currentUser(req).id) });
});

router.post('/', validate(schemas.supportSession), async (req, res) => {
  res.status(201).json({ session: await referralService.logSession(currentUser(req).id, getValid(req, schemas.supportSession)) });
});

router.delete('/:id', validate(schemas.idParam, 'params'), async (req, res) => {
  const { id } = getValid(req, schemas.idParam, 'params');
  await referralService.deleteSession(currentUser(req).id, id);
  res.status(204).end();
});

export default router;
