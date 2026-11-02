import { Router } from 'express';
import * as storiesService from '../services/stories.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const bySlug = validate(schemas.slugParam, 'params');

router.get('/', async (req, res) => {
  res.json(await storiesService.listStories(currentUser(req).id));
});

router.get('/:slug', bySlug, async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json({ story: await storiesService.getStory(slug, currentUser(req).id) });
});

router.post('/:slug/read', bySlug, async (req, res) => {
  const { slug } = getValid(req, schemas.slugParam, 'params');
  res.json(await storiesService.markStoryRead(slug, currentUser(req).id));
});

export default router;
