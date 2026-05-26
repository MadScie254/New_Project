import { Request, Response } from 'express';
import { contributionService } from '../services/contribution.service';

export class ContributionController {
  async getCycles(req: Request, res: Response) {
    try {
      const cycles = await contributionService.getCycles(req.params.chamaId);
      res.json(cycles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCycleDetails(req: Request, res: Response) {
    try {
      const cycle = await contributionService.getCycleDetails(req.params.cycleId);
      if (!cycle) {
        res.status(404).json({ error: 'Cycle not found.' });
        return;
      }
      res.json(cycle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createCycle(req: Request, res: Response) {
    try {
      const { dueDate, amount } = req.body;
      const cycle = await contributionService.createCycle(req.params.chamaId, dueDate, amount);
      res.status(201).json(cycle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async recordPayment(req: Request, res: Response) {
    try {
      const { amount, mpesaRef } = req.body;
      const result = await contributionService.recordPayment(req.params.contributionId, amount, mpesaRef);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, penaltyAmount } = req.body;
      const result = await contributionService.updateStatus(req.params.contributionId, status, penaltyAmount);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMemberHistory(req: Request, res: Response) {
    try {
      const history = await contributionService.getMemberHistory(req.params.memberId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMemberStats(req: Request, res: Response) {
    try {
      const stats = await contributionService.getMemberStats(req.params.memberId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateCycles(req: Request, res: Response) {
    try {
      const { count } = req.body;
      const cycles = await contributionService.generateCycles(req.params.chamaId, count || 1);
      res.status(201).json(cycles);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const contributionController = new ContributionController();
