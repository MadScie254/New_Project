import { Router } from 'express';
import { z } from 'zod';
import { mpesaController } from '../controllers/mpesa.controller';
import { authGuard } from '../middleware/auth.guard';
import { validate } from '../middleware/validate';

const router = Router();

const stkPushSchema = z.object({
  phone: z.string().min(10),
  amount: z.number().positive(),
  accountRef: z.string().optional(),
  contributionId: z.string().optional(),
  repaymentId: z.string().optional(),
});

// STK Push requires auth
router.post('/stkpush', authGuard, validate({ body: stkPushSchema }), (req, res) => mpesaController.initiateSTKPush(req, res));

// Callback is public (called by Safaricom servers)
router.post('/callback', (req, res) => mpesaController.handleCallback(req, res));

// Query status requires auth
router.get('/status/:checkoutRequestId', authGuard, (req, res) => mpesaController.queryStatus(req, res));

export default router;
