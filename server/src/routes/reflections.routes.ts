import { Router } from 'express';
import * as selfcareService from '../services/selfcare.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ reflections: await selfcareService.listReflections(currentUser(req).id) });
});

router.post('/', validate(schemas.reflection), async (req, res) => {
  res.status(201).json({ reflection: await selfcareService.createReflection(currentUser(req).id, getValid(req, schemas.reflection)) });
});

router.delete('/:id', validate(schemas.idParam, 'params'), async (req, res) => {
  const { id } = getValid(req, schemas.idParam, 'params');
  await selfcareService.deleteReflection(currentUser(req).id, id);
  res.status(204).end();
});

export default router;
