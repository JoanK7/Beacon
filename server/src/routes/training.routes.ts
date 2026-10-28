import { Router } from 'express';
import { z } from 'zod';
import * as trainingService from '../services/training.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const sectionParams = z.object({ slug: z.string().max(80), sectionId: z.coerce.number().int().positive() });

router.get('/', async (req, res) => {
  res.json({ modules: await trainingService.listModules(currentUser(req).id) });
});

router.get('/:slug', validate(schemas.slugParam, 'params'), async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json({ module: await trainingService.getModule(slug, currentUser(req).id) });
});

router.post('/:slug/sections/:sectionId/view', validate(sectionParams, 'params'), async (req, res) => {
  const { slug, sectionId } = getValid(req, sectionParams, 'params');
  res.json(await trainingService.markSectionViewed(slug, sectionId, currentUser(req).id));
});

export default router;
