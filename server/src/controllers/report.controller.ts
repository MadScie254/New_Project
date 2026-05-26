import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportController {
  /**
   * Monthly financial statement
   */
  async getMonthlyStatement(req: Request, res: Response) {
    try {
      const { chamaId } = req.params;
      const { year, month } = req.query;

      const y = parseInt(year as string) || new Date().getFullYear();
      const m = parseInt(month as string) || new Date().getMonth() + 1;

      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      // Income: contributions
      const contributions = await prisma.contribution.aggregate({
        where: {
          cycle: { chama_id: chamaId },
          status: 'PAID',
          paid_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount_paid: true },
        _count: true,
      });

      // Income: loan repayments
      const repayments = await prisma.loanRepayment.aggregate({
        where: {
          loan: { chama_id: chamaId },
          status: 'PAID',
          paid_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Income: fines
      const fines = await prisma.fine.aggregate({
        where: {
          chama_id: chamaId,
          paid: true,
          created_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Disbursements: loans
      const disbursements = await prisma.loan.aggregate({
        where: {
          chama_id: chamaId,
          status: { in: ['DISBURSED', 'REPAID'] },
          disbursed_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      const totalIncome = Number(contributions._sum.amount_paid || 0) +
        Number(repayments._sum.amount || 0) +
        Number(fines._sum.amount || 0);

      const totalDisbursements = Number(disbursements._sum.amount || 0);

      res.json({
        period: { year: y, month: m },
        income: {
          contributions: Number(contributions._sum.amount_paid || 0),
          contribution_count: contributions._count,
          loan_repayments: Number(repayments._sum.amount || 0),
          repayment_count: repayments._count,
          fines: Number(fines._sum.amount || 0),
          fine_count: fines._count,
          total: totalIncome,
        },
        disbursements: {
          loans: Number(disbursements._sum.amount || 0),
          loan_count: disbursements._count,
          total: totalDisbursements,
        },
        net: totalIncome - totalDisbursements,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Member compliance report
   */
  async getComplianceReport(req: Request, res: Response) {
    try {
      const { chamaId } = req.params;

      const members = await prisma.chamaMember.findMany({
        where: { chama_id: chamaId, is_active: true },
        include: {
          user: { select: { name: true, phone: true } },
          contributions: true,
        },
      });

      const report = members.map((member) => {
        const total = member.contributions.length;
        const paid = member.contributions.filter((c) => c.status === 'PAID').length;
        const late = member.contributions.filter((c) => c.status === 'LATE').length;
        const pending = member.contributions.filter((c) => c.status === 'PENDING').length;
        const totalPaid = member.contributions
          .filter((c) => c.status === 'PAID')
          .reduce((sum, c) => sum + Number(c.amount_paid), 0);

        return {
          member_id: member.id,
          name: member.user.name,
          phone: member.user.phone,
          role: member.role,
          total_cycles: total,
          paid_count: paid,
          late_count: late,
          pending_count: pending,
          compliance_rate: total > 0 ? Math.round((paid / total) * 100) : 0,
          total_contributed: totalPaid,
        };
      });

      report.sort((a, b) => b.compliance_rate - a.compliance_rate);

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Defaulters report
   */
  async getDefaultersReport(req: Request, res: Response) {
    try {
      const { chamaId } = req.params;

      // Members with pending contributions past due
      const lateContributions = await prisma.contribution.findMany({
        where: {
          cycle: {
            chama_id: chamaId,
            due_date: { lt: new Date() },
          },
          status: { in: ['PENDING', 'LATE'] },
        },
        include: {
          member: {
            include: { user: { select: { name: true, phone: true } } },
          },
          cycle: { select: { due_date: true, amount: true, cycle_number: true } },
        },
      });

      // Members with overdue loan repayments
      const overdueLoans = await prisma.loanRepayment.findMany({
        where: {
          loan: { chama_id: chamaId },
          status: 'PENDING',
          due_date: { lt: new Date() },
        },
        include: {
          loan: {
            include: {
              applicant: {
                include: { user: { select: { name: true, phone: true } } },
              },
            },
          },
        },
      });

      // Unpaid fines
      const unpaidFines = await prisma.fine.findMany({
        where: {
          chama_id: chamaId,
          paid: false,
        },
        include: {
          member: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      });

      res.json({
        late_contributions: lateContributions,
        overdue_loans: overdueLoans,
        unpaid_fines: unpaidFines,
        summary: {
          late_contribution_count: lateContributions.length,
          overdue_loan_count: overdueLoans.length,
          unpaid_fine_count: unpaidFines.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Annual summary
   */
  async getAnnualSummary(req: Request, res: Response) {
    try {
      const { chamaId } = req.params;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const contributions = await prisma.contribution.aggregate({
        where: {
          cycle: { chama_id: chamaId },
          status: 'PAID',
          paid_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount_paid: true },
        _count: true,
      });

      const loans = await prisma.loan.aggregate({
        where: {
          chama_id: chamaId,
          disbursed_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      const meetings = await prisma.meeting.count({
        where: {
          chama_id: chamaId,
          scheduled_at: { gte: startDate, lte: endDate },
        },
      });

      res.json({
        year,
        total_contributions: Number(contributions._sum.amount_paid || 0),
        contribution_transactions: contributions._count,
        total_loans_disbursed: Number(loans._sum.amount || 0),
        loans_count: loans._count,
        meetings_held: meetings,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const reportController = new ReportController();
