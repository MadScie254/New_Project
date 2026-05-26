import { Router } from 'express';
import { z } from 'zod';
import { investmentController } from '../controllers/investment.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard, memberGuard } from '../middleware/role.guard';
import { validate } from '../middleware/validate';

const router = Router();

const investmentSchema = z.object({
  name: z.string().min(2),
  institution: z.string().min(2),
  amount: z.number().positive(),
  roiExpected: z.number().min(0).optional(),
  maturityDate: z.string().optional(),
});

router.use(authGuard);

router.get('/:chamaId/investments', memberGuard(), (req, res) => investmentController.getAll(req, res));
router.get('/:chamaId/investments/portfolio', memberGuard(), (req, res) => investmentController.getPortfolio(req, res));
router.post('/:chamaId/investments', roleGuard('TREASURER', 'CHAIRMAN'), validate({ body: investmentSchema }), (req, res) => investmentController.create(req, res));
router.put('/:chamaId/investments/:investmentId', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => investmentController.update(req, res));
router.delete('/:chamaId/investments/:investmentId', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => investmentController.delete(req, res));

export default router;
