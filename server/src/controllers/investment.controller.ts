import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InvestmentController {
  async create(req: Request, res: Response) {
    try {
      const investment = await prisma.investment.create({
        data: {
          chama_id: req.params.chamaId,
          name: req.body.name,
          institution: req.body.institution,
          amount: req.body.amount,
          roi_expected: req.body.roiExpected || 0,
          maturity_date: req.body.maturityDate ? new Date(req.body.maturityDate) : null,
        },
      });
      res.status(201).json(investment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const investments = await prisma.investment.findMany({
        where: { chama_id: req.params.chamaId },
        orderBy: { created_at: 'desc' },
      });
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPortfolio(req: Request, res: Response) {
    try {
      const investments = await prisma.investment.findMany({
        where: { chama_id: req.params.chamaId },
      });

      const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const activeCount = investments.filter((inv) => inv.status === 'ACTIVE').length;
      const maturedCount = investments.filter((inv) => inv.status === 'MATURED').length;

      const avgROI = investments.length > 0
        ? investments.reduce((sum, inv) => sum + Number(inv.roi_expected), 0) / investments.length
        : 0;

      res.json({
        total_invested: totalInvested,
        active_count: activeCount,
        matured_count: maturedCount,
        average_roi: Math.round(avgROI * 100) / 100,
        investments,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const investment = await prisma.investment.update({
        where: { id: req.params.investmentId },
        data: {
          name: req.body.name,
          institution: req.body.institution,
          amount: req.body.amount,
          roi_expected: req.body.roiExpected,
          maturity_date: req.body.maturityDate ? new Date(req.body.maturityDate) : undefined,
          status: req.body.status,
        },
      });
      res.json(investment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await prisma.investment.delete({
        where: { id: req.params.investmentId },
      });
      res.json({ message: 'Investment deleted.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const investmentController = new InvestmentController();
