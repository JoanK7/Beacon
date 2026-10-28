import { Router } from 'express';
import * as progressService from '../services/progress.service';
import { currentUser } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ progress: await progressService.getSummary(currentUser(req).id) });
});

export default router;
