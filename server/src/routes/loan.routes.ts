import { Router } from 'express';
import { z } from 'zod';
import { loanController } from '../controllers/loan.controller';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard, memberGuard } from '../middleware/role.guard';
import { validate } from '../middleware/validate';

const router = Router();

const applySchema = z.object({
  amount: z.number().positive('Loan amount must be positive'),
  purpose: z.string().min(5, 'Please describe the loan purpose'),
  repaymentMonths: z.number().int().min(1).max(24).optional(),
});

router.use(authGuard);

router.post('/:chamaId/loans', memberGuard(), validate({ body: applySchema }), (req, res) => loanController.apply(req, res));
router.get('/:chamaId/loans', memberGuard(), (req, res) => loanController.getChamaLoans(req, res));
router.get('/:chamaId/loans/defaulters', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => loanController.getDefaulters(req, res));
router.get('/:chamaId/loans/:loanId', memberGuard(), (req, res) => loanController.getDetails(req, res));
router.post('/:chamaId/loans/:loanId/approve', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => loanController.approve(req, res));
router.post('/:chamaId/loans/:loanId/reject', roleGuard('TREASURER', 'CHAIRMAN'), (req, res) => loanController.reject(req, res));
router.post('/:chamaId/loans/:loanId/disburse', roleGuard('TREASURER'), (req, res) => loanController.disburse(req, res));
router.post('/:chamaId/loans/repayments/:repaymentId/pay', memberGuard(), (req, res) => loanController.recordRepayment(req, res));

export default router;
