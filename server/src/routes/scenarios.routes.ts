import { Router } from 'express';
import * as scenarioService from '../services/scenario.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const bySlug = validate(schemas.slugParam, 'params');

router.get('/', async (req, res) => {
  res.json({ scenarios: await scenarioService.listScenarios(currentUser(req).id) });
});

router.get('/:slug', bySlug, async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json({ scenario: await scenarioService.getScenario(slug) });
});

router.post('/:slug/complete', bySlug, validate(schemas.scenarioCompletion), async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  const { path } = getValid(req, schemas.scenarioCompletion);
  res.status(201).json({ result: await scenarioService.completeScenario(slug, currentUser(req).id, path) });
});

export default router;
