import { Request, Response } from 'express';
import { mpesaService } from '../services/mpesa.service';
import { contributionService } from '../services/contribution.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MpesaController {
  async initiateSTKPush(req: Request, res: Response) {
    try {
      const { phone, amount, accountRef, contributionId, repaymentId } = req.body;

      const result = await mpesaService.initiateSTKPush(
        phone,
        amount,
        accountRef || 'ChamaOS',
        `Payment for ${accountRef}`
      );

      // Store reference to contribution/repayment for callback processing
      if (contributionId || repaymentId) {
        await prisma.mpesaTransaction.update({
          where: { checkout_request_id: result.checkoutRequestId },
          data: {
            account_ref: JSON.stringify({ contributionId, repaymentId, accountRef }),
          },
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async handleCallback(req: Request, res: Response) {
    try {
      const result = await mpesaService.handleCallback(req.body);

      if (result.success && result.transaction) {
        // Process linked contribution/repayment
        try {
          const refs = JSON.parse(result.transaction.account_ref);

          if (refs.contributionId) {
            await contributionService.recordPayment(
              refs.contributionId,
              Number(result.transaction.amount),
              result.transaction.mpesa_receipt || undefined
            );
          }

          // Create notification
          const user = await prisma.user.findFirst({
            where: { phone: result.transaction.phone },
          });

          if (user) {
            await prisma.notification.create({
              data: {
                user_id: user.id,
                message: `Payment of KES ${Number(result.transaction.amount).toLocaleString()} received. Ref: ${result.transaction.mpesa_receipt}`,
              },
            });
          }
        } catch (e) {
          // account_ref might not be valid JSON (for direct payments)
          console.log('[M-Pesa] No linked records for this transaction');
        }
      }

      // Always respond with success to M-Pesa
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
      console.error('[M-Pesa] Callback error:', error.message);
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }

  async queryStatus(req: Request, res: Response) {
    try {
      const result = await mpesaService.queryTransactionStatus(req.params.checkoutRequestId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const mpesaController = new MpesaController();
