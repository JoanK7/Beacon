import { Router } from 'express';
import * as dashboardService from '../services/dashboard.service';

const router = Router();

router.get('/', async (_req, res) => {
  res.json({ dashboard: await dashboardService.getCohortDashboard() });
});

export default router;
