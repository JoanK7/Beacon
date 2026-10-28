import { Router } from 'express';
import * as referralService from '../services/referral.service';
import * as schemas from '../schemas';
import { validate, getValid } from '../middleware/validate';

const router = Router();

router.get('/', validate(schemas.providerQuery, 'query'), async (req, res) => {
  res.json({ providers: await referralService.searchProviders(getValid(req, schemas.providerQuery, 'query')) });
});

router.get('/:id', validate(schemas.idParam, 'params'), async (req, res) => {
  const { id } = getValid(req, schemas.idParam, 'params');
  res.json({ provider: await referralService.getProvider(id) });
});

export default router;
