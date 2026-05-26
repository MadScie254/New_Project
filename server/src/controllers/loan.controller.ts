import { Request, Response } from 'express';
import { loanService } from '../services/loan.service';

export class LoanController {
  async apply(req: Request, res: Response) {
    try {
      const loan = await loanService.applyForLoan({
        chamaId: req.params.chamaId,
        applicantId: (req as any).membership.id,
        amount: req.body.amount,
        purpose: req.body.purpose,
        repaymentMonths: req.body.repaymentMonths || 3,
      });
      res.status(201).json(loan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getChamaLoans(req: Request, res: Response) {
    try {
      const loans = await loanService.getChamaLoans(req.params.chamaId, req.query.status as string);
      res.json(loans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const loan = await loanService.approveLoan(req.params.loanId);
      res.json(loan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const loan = await loanService.rejectLoan(req.params.loanId);
      res.json(loan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async disburse(req: Request, res: Response) {
    try {
      const loan = await loanService.disburseLoan(req.params.loanId);
      res.json(loan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async recordRepayment(req: Request, res: Response) {
    try {
      const result = await loanService.recordRepayment(
        req.params.repaymentId,
        req.body.amount,
        req.body.mpesaRef
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const loan = await loanService.getLoanDetails(req.params.loanId);
      if (!loan) {
        res.status(404).json({ error: 'Loan not found.' });
        return;
      }
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDefaulters(req: Request, res: Response) {
    try {
      const defaulters = await loanService.getDefaulters(req.params.chamaId);
      res.json(defaulters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const loanController = new LoanController();
