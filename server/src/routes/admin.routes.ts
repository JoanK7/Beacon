import { Router } from 'express';
import * as adminService from '../services/admin.service';
import * as referralService from '../services/referral.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';

const router = Router();
const byId = validate(schemas.idParam, 'params');
const idOf = (req: Parameters<typeof getValid>[0]) => getValid(req, schemas.idParam, 'params').id;

// Training modules (including their sections and quiz)
router.get('/modules', async (_req, res) => {
  res.json({ modules: await adminService.listAllModules() });
});
router.get('/modules/:id', byId, async (req, res) => {
  res.json({ module: await adminService.getModuleForEdit(idOf(req)) });
});
router.post('/modules', validate(schemas.moduleInput), async (req, res) => {
  res.status(201).json({ module: await adminService.createModule(getValid(req, schemas.moduleInput)) });
});
router.put('/modules/:id', byId, validate(schemas.moduleInput), async (req, res) => {
  res.json({ module: await adminService.updateModule(idOf(req), getValid(req, schemas.moduleInput)) });
});
router.patch('/modules/:id/status', byId, validate(schemas.contentStatus), async (req, res) => {
  await adminService.setModuleStatus(idOf(req), getValid(req, schemas.contentStatus).status);
  res.status(204).end();
});

// Scenario role-plays (authored in code; admins control visibility)
router.get('/scenarios', async (_req, res) => {
  res.json({ scenarios: await adminService.listAllScenarios() });
});
router.patch('/scenarios/:id/status', byId, validate(schemas.contentStatus), async (req, res) => {
  await adminService.setScenarioStatus(idOf(req), getValid(req, schemas.contentStatus).status);
  res.status(204).end();
});

// Referral directory
router.get('/providers', async (_req, res) => {
  res.json({ providers: await referralService.searchProviders({ includeArchived: true }) });
});
router.post('/providers', validate(schemas.providerInput), async (req, res) => {
  res.status(201).json({ provider: await adminService.createProvider(getValid(req, schemas.providerInput)) });
});
router.put('/providers/:id', byId, validate(schemas.providerInput), async (req, res) => {
  res.json({ provider: await adminService.updateProvider(idOf(req), getValid(req, schemas.providerInput)) });
});
router.patch('/providers/:id/archive', byId, validate(schemas.archiveToggle), async (req, res) => {
  await adminService.setProviderArchived(idOf(req), getValid(req, schemas.archiveToggle).archived);
  res.status(204).end();
});

export default router;
