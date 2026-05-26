import { PrismaClient, ChamaRole } from '@prisma/client';
import { generateInviteCode } from '../utils/formatters';

const prisma = new PrismaClient();

export class ChamaService {
  /**
   * Create a new chama
   */
  async createChama(userId: string, data: {
    name: string;
    description?: string;
    frequency: string;
    contribution_amount: number;
    start_date: string;
    max_members?: number;
  }) {
    const chama = await prisma.chama.create({
      data: {
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        contribution_amount: data.contribution_amount,
        start_date: new Date(data.start_date),
        max_members: data.max_members || 30,
        invite_code: generateInviteCode(),
        created_by_id: userId,
        members: {
          create: {
            user_id: userId,
            role: ChamaRole.CHAIRMAN,
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, phone: true, photo_url: true } } } },
      },
    });

    return chama;
  }

  /**
   * Get all chamas for a user
   */
  async getUserChamas(userId: string) {
    const memberships = await prisma.chamaMember.findMany({
      where: { user_id: userId, is_active: true },
      include: {
        chama: {
          include: {
            members: { where: { is_active: true }, select: { id: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.chama.id,
      name: m.chama.name,
      description: m.chama.description,
      frequency: m.chama.frequency,
      contribution_amount: m.chama.contribution_amount,
      role: m.role,
      member_count: m.chama.members.length,
      max_members: m.chama.max_members,
    }));
  }

  /**
   * Get chama details with members
   */
  async getChamaDetails(chamaId: string) {
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      include: {
        members: {
          where: { is_active: true },
          include: {
            user: {
              select: { id: true, name: true, phone: true, photo_url: true },
            },
          },
          orderBy: { role: 'asc' },
        },
        _count: {
          select: {
            cycles: true,
            loans: true,
            investments: true,
            meetings: true,
          },
        },
      },
    });

    if (!chama) {
      throw new Error('Chama not found.');
    }

    return chama;
  }

  /**
   * Join chama via invite code
   */
  async joinByInviteCode(userId: string, inviteCode: string) {
    const chama = await prisma.chama.findUnique({
      where: { invite_code: inviteCode },
      include: { members: { where: { is_active: true } } },
    });

    if (!chama) {
      throw new Error('Invalid invite code.');
    }

    if (chama.members.length >= chama.max_members) {
      throw new Error('This chama has reached its member limit.');
    }

    // Check if already a member
    const existing = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chama.id, user_id: userId } },
    });

    if (existing) {
      if (existing.is_active) {
        throw new Error('You are already a member of this chama.');
      }
      // Reactivate membership
      await prisma.chamaMember.update({
        where: { id: existing.id },
        data: { is_active: true },
      });
    } else {
      await prisma.chamaMember.create({
        data: {
          chama_id: chama.id,
          user_id: userId,
          role: ChamaRole.MEMBER,
        },
      });
    }

    return { chamaId: chama.id, chamaName: chama.name };
  }

  /**
   * Invite member by phone
   */
  async inviteMember(chamaId: string, phone: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('User not found. They need to register on Chama OS first.');
    }

    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      include: { members: { where: { is_active: true } } },
    });

    if (!chama) {
      throw new Error('Chama not found.');
    }

    if (chama.members.length >= chama.max_members) {
      throw new Error('This chama has reached its member limit.');
    }

    const existing = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: user.id } },
    });

    if (existing && existing.is_active) {
      throw new Error('This user is already a member.');
    }

    if (existing) {
      await prisma.chamaMember.update({
        where: { id: existing.id },
        data: { is_active: true },
      });
    } else {
      await prisma.chamaMember.create({
        data: {
          chama_id: chamaId,
          user_id: user.id,
          role: ChamaRole.MEMBER,
        },
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: user.id,
        chama_id: chamaId,
        message: `You've been added to ${chama.name}!`,
      },
    });

    return { userId: user.id, name: user.name };
  }

  /**
   * Update member role
   */
  async updateMemberRole(chamaId: string, memberId: string, role: ChamaRole) {
    const member = await prisma.chamaMember.update({
      where: { id: memberId, chama_id: chamaId },
      data: { role },
      include: { user: { select: { name: true } } },
    });

    return member;
  }

  /**
   * Get chama wallet balance (total contributions - total disbursements)
   */
  async getWalletBalance(chamaId: string) {
    const contributions = await prisma.contribution.aggregate({
      where: {
        cycle: { chama_id: chamaId },
        status: 'PAID',
      },
      _sum: { amount_paid: true },
    });

    const disbursedLoans = await prisma.loan.aggregate({
      where: {
        chama_id: chamaId,
        status: { in: ['DISBURSED', 'REPAID'] },
      },
      _sum: { amount: true },
    });

    const loanRepayments = await prisma.loanRepayment.aggregate({
      where: {
        loan: { chama_id: chamaId },
        status: 'PAID',
      },
      _sum: { amount: true },
    });

    const finesPaid = await prisma.fine.aggregate({
      where: {
        chama_id: chamaId,
        paid: true,
      },
      _sum: { amount: true },
    });

    const totalIn = Number(contributions._sum.amount_paid || 0) +
      Number(loanRepayments._sum.amount || 0) +
      Number(finesPaid._sum.amount || 0);

    const totalOut = Number(disbursedLoans._sum.amount || 0);

    return {
      balance: totalIn - totalOut,
      total_contributions: Number(contributions._sum.amount_paid || 0),
      total_disbursed: totalOut,
      total_repayments: Number(loanRepayments._sum.amount || 0),
      total_fines: Number(finesPaid._sum.amount || 0),
    };
  }

  /**
   * Update chama settings
   */
  async updateChama(chamaId: string, data: {
    name?: string;
    description?: string;
    frequency?: string;
    contribution_amount?: number;
    max_members?: number;
    constitution_url?: string;
  }) {
    return prisma.chama.update({
      where: { id: chamaId },
      data,
    });
  }

  /**
   * Get chama dashboard data
   */
  async getDashboard(chamaId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Wallet
    const wallet = await this.getWalletBalance(chamaId);

    // This month's collection
    const monthlyContributions = await prisma.contribution.findMany({
      where: {
        cycle: {
          chama_id: chamaId,
          due_date: { gte: startOfMonth, lte: endOfMonth },
        },
      },
      include: { cycle: true },
    });

    const collected = monthlyContributions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + Number(c.amount_paid), 0);

    const expected = monthlyContributions.length > 0
      ? monthlyContributions.reduce((sum, c) => sum + Number(c.cycle.amount), 0)
      : 0;

    // Active loans
    const activeLoans = await prisma.loan.count({
      where: { chama_id: chamaId, status: { in: ['APPROVED', 'DISBURSED'] } },
    });

    const outstandingLoanAmount = await prisma.loan.aggregate({
      where: { chama_id: chamaId, status: 'DISBURSED' },
      _sum: { amount: true },
    });

    // Next meeting
    const nextMeeting = await prisma.meeting.findFirst({
      where: {
        chama_id: chamaId,
        scheduled_at: { gte: now },
        status: 'SCHEDULED',
      },
      orderBy: { scheduled_at: 'asc' },
    });

    // Recent activity (notifications)
    const recentActivity = await prisma.notification.findMany({
      where: { chama_id: chamaId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    // Members
    const memberCount = await prisma.chamaMember.count({
      where: { chama_id: chamaId, is_active: true },
    });

    return {
      wallet,
      monthly_collection: {
        collected,
        expected,
        percentage: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      },
      active_loans: activeLoans,
      outstanding_loan_amount: Number(outstandingLoanAmount._sum.amount || 0),
      next_meeting: nextMeeting,
      recent_activity: recentActivity,
      member_count: memberCount,
    };
  }
}

export const chamaService = new ChamaService();
