import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export class LoanService {
  /**
   * Apply for a loan
   */
  async applyForLoan(data: {
    chamaId: string;
    applicantId: string;
    amount: number;
    purpose: string;
    repaymentMonths: number;
  }) {
    // Check eligibility: loan ≤ 3× total contributions
    const member = await prisma.chamaMember.findUnique({
      where: { id: data.applicantId },
    });

    if (!member) throw new Error('Member not found.');

    const totalContributions = await prisma.contribution.aggregate({
      where: { member_id: data.applicantId, status: 'PAID' },
      _sum: { amount_paid: true },
    });

    const maxLoan = Number(totalContributions._sum.amount_paid || 0) * 3;

    if (data.amount > maxLoan) {
      throw new Error(
        `Loan amount exceeds limit. Maximum eligible: KES ${maxLoan.toLocaleString()}. Your total contributions: KES ${Number(totalContributions._sum.amount_paid || 0).toLocaleString()}.`
      );
    }

    // Check for existing active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        applicant_id: data.applicantId,
        status: { in: ['PENDING', 'APPROVED', 'DISBURSED'] },
      },
    });

    if (activeLoan) {
      throw new Error('You already have an active loan. Please clear it before applying for a new one.');
    }

    const loan = await prisma.loan.create({
      data: {
        chama_id: data.chamaId,
        applicant_id: data.applicantId,
        amount: data.amount,
        purpose: data.purpose,
        repayment_months: data.repaymentMonths,
        interest_rate: 10, // Default 10% p.a.
      },
      include: {
        applicant: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
      },
    });

    return loan;
  }

  /**
   * Get all loans for a chama
   */
  async getChamaLoans(chamaId: string, status?: string) {
    return prisma.loan.findMany({
      where: {
        chama_id: chamaId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        applicant: {
          include: { user: { select: { id: true, name: true, phone: true, photo_url: true } } },
        },
        repayments: { orderBy: { due_date: 'asc' } },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  /**
   * Approve a loan (Secretary → Treasurer workflow)
   */
  async approveLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new Error('Loan not found.');
    if (loan.status !== 'PENDING') throw new Error('Loan is not in pending status.');

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
      },
      include: {
        applicant: { include: { user: { select: { id: true, name: true } } } },
        chama: { select: { name: true } },
      },
    });

    await notificationService.notifyUser({
      userId: updated.applicant.user.id,
      chamaId: updated.chama_id,
      message: `Your loan request for KES ${Number(updated.amount).toLocaleString()} has been approved in ${updated.chama.name}.`,
    });

    return updated;
  }

  /**
   * Reject a loan
   */
  async rejectLoan(loanId: string) {
    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REJECTED' },
      include: {
        applicant: { include: { user: { select: { id: true, name: true } } } },
        chama: { select: { name: true } },
      },
    });

    await notificationService.notifyUser({
      userId: updated.applicant.user.id,
      chamaId: updated.chama_id,
      message: `Your loan request in ${updated.chama.name} was rejected.`,
    });

    return updated;
  }

  /**
   * Disburse an approved loan — generate repayment schedule
   */
  async disburseLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new Error('Loan not found.');
    if (loan.status !== 'APPROVED') throw new Error('Loan must be approved before disbursement.');

    // Generate repayment schedule
    const totalAmount = Number(loan.amount) * (1 + Number(loan.interest_rate) / 100);
    const monthlyAmount = Math.ceil(totalAmount / loan.repayment_months);

    const repayments = [];
    for (let i = 1; i <= loan.repayment_months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      repayments.push({
        loan_id: loanId,
        amount: i === loan.repayment_months
          ? totalAmount - monthlyAmount * (loan.repayment_months - 1)
          : monthlyAmount,
        due_date: dueDate,
      });
    }

    // Update loan and create repayments
    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'DISBURSED',
          disbursed_at: new Date(),
        },
        include: {
          applicant: { include: { user: { select: { id: true, name: true } } } },
          chama: { select: { name: true } },
        },
      }),
      ...repayments.map((r) =>
        prisma.loanRepayment.create({ data: r })
      ),
    ]);

    await notificationService.notifyUser({
      userId: updatedLoan.applicant.user.id,
      chamaId: updatedLoan.chama_id,
      message: `Your loan has been disbursed in ${updatedLoan.chama.name}. Amount: KES ${Number(updatedLoan.amount).toLocaleString()}.`,
    });

    return updatedLoan;
  }

  /**
   * Record a loan repayment
   */
  async recordRepayment(repaymentId: string, amount: number, mpesaRef?: string) {
    const repayment = await prisma.loanRepayment.update({
      where: { id: repaymentId },
      data: {
        amount,
        paid_at: new Date(),
        mpesa_ref: mpesaRef,
        status: 'PAID',
      },
    });

    // Check if all repayments are paid
    const loan = await prisma.loan.findUnique({
      where: { id: repayment.loan_id },
      include: { repayments: true },
    });

    if (loan) {
      const allPaid = loan.repayments.every((r) => r.status === 'PAID');
      if (allPaid) {
        await prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'REPAID' },
        });
      }
    }

    const repaymentLoan = await prisma.loan.findUnique({
      where: { id: repayment.loan_id },
      include: {
        applicant: { include: { user: { select: { id: true, name: true } } } },
        chama: { select: { name: true } },
      },
    });

    if (repaymentLoan) {
      await notificationService.notifyUser({
        userId: repaymentLoan.applicant.user.id,
        chamaId: repaymentLoan.chama_id,
        message: `Loan repayment received in ${repaymentLoan.chama.name}. Amount: KES ${Number(amount).toLocaleString()}.`,
      });

      if (repaymentLoan.status === 'REPAID') {
        await notificationService.notifyUser({
          userId: repaymentLoan.applicant.user.id,
          chamaId: repaymentLoan.chama_id,
          message: `Your loan in ${repaymentLoan.chama.name} is now fully repaid.`,
        });
      }
    }

    return repayment;
  }

  /**
   * Get loan details with repayment schedule
   */
  async getLoanDetails(loanId: string) {
    return prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        applicant: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        repayments: { orderBy: { due_date: 'asc' } },
        chama: { select: { name: true } },
      },
    });
  }

  /**
   * Get member's loans
   */
  async getMemberLoans(memberId: string) {
    return prisma.loan.findMany({
      where: { applicant_id: memberId },
      include: {
        repayments: { orderBy: { due_date: 'asc' } },
        chama: { select: { name: true } },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  /**
   * Get defaulters (overdue repayments)
   */
  async getDefaulters(chamaId: string) {
    const overdue = await prisma.loanRepayment.findMany({
      where: {
        loan: { chama_id: chamaId, status: 'DISBURSED' },
        status: 'PENDING',
        due_date: { lt: new Date() },
      },
      include: {
        loan: {
          include: {
            applicant: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
      },
    });

    return overdue;
  }
}

export const loanService = new LoanService();
