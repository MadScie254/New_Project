import { Router } from 'express';
import { z } from 'zod';
import { contributionController } from '../controllers/contribution.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard, memberGuard } from '../middleware/role.guard';
import { validate } from '../middleware/validate';

const router = Router();

const createCycleSchema = z.object({
  dueDate: z.string(),
  amount: z.number().positive(),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  mpesaRef: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PAID', 'PENDING', 'LATE', 'WAIVED']),
  penaltyAmount: z.number().min(0).optional(),
});

router.use(authGuard);

// Cycles
router.get('/:chamaId/cycles', memberGuard(), (req, res) => contributionController.getCycles(req, res));
router.post('/:chamaId/cycles', roleGuard('CHAIRMAN', 'TREASURER'), validate({ body: createCycleSchema }), (req, res) => contributionController.createCycle(req, res));
router.post('/:chamaId/cycles/generate', roleGuard('CHAIRMAN', 'TREASURER'), (req, res) => contributionController.generateCycles(req, res));
router.get('/:chamaId/cycles/:cycleId', memberGuard(), (req, res) => contributionController.getCycleDetails(req, res));

// Contributions
router.post('/:chamaId/contributions/:contributionId/pay', memberGuard(), validate({ body: recordPaymentSchema }), (req, res) => contributionController.recordPayment(req, res));
router.put('/:chamaId/contributions/:contributionId/status', roleGuard('TREASURER', 'CHAIRMAN'), validate({ body: updateStatusSchema }), (req, res) => contributionController.updateStatus(req, res));

// Member stats
router.get('/:chamaId/members/:memberId/contributions', memberGuard(), (req, res) => contributionController.getMemberHistory(req, res));
router.get('/:chamaId/members/:memberId/stats', memberGuard(), (req, res) => contributionController.getMemberStats(req, res));

export default router;
