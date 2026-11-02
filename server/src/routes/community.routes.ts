import { Router } from 'express';
import * as communityService from '../services/community.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';
import { currentUser } from '../middleware/auth';

const router = Router();
const byId = validate(schemas.idParam, 'params');
const idOf = (req: Parameters<typeof getValid>[0]) => getValid(req, schemas.idParam, 'params').id;

router.get('/posts', async (req, res) => {
  res.json({ posts: await communityService.listPosts(currentUser(req).id) });
});

router.post('/posts', validate(schemas.moodPost), async (req, res) => {
  const { mood, note } = getValid(req, schemas.moodPost);
  res.status(201).json({ post: await communityService.createPost(currentUser(req).id, mood, note) });
});

router.delete('/posts/:id', byId, async (req, res) => {
  await communityService.deletePost(currentUser(req).id, idOf(req));
  res.status(204).end();
});

router.post('/posts/:id/support', byId, validate(schemas.moodSupport), async (req, res) => {
  const { kind } = getValid(req, schemas.moodSupport);
  res.json({ post: await communityService.toggleSupport(currentUser(req).id, idOf(req), kind) });
});

router.post('/posts/:id/report', byId, async (req, res) => {
  res.json(await communityService.reportPost(currentUser(req).id, idOf(req)));
});

export default router;
