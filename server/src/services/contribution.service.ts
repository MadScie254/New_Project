import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export class ContributionService {
  /**
   * Get all cycles for a chama
   */
  async getCycles(chamaId: string) {
    return prisma.contributionCycle.findMany({
      where: { chama_id: chamaId },
      include: {
        contributions: {
          include: {
            member: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        _count: { select: { contributions: true } },
      },
      orderBy: { due_date: 'desc' },
    });
  }

  /**
   * Get single cycle details
   */
  async getCycleDetails(cycleId: string) {
    return prisma.contributionCycle.findUnique({
      where: { id: cycleId },
      include: {
        contributions: {
          include: {
            member: {
              include: { user: { select: { id: true, name: true, phone: true, photo_url: true } } },
            },
          },
        },
        chama: { select: { name: true, contribution_amount: true } },
      },
    });
  }

  /**
   * Create contribution cycle
   */
  async createCycle(chamaId: string, dueDate: string, amount: number) {
    // Get active members
    const members = await prisma.chamaMember.findMany({
      where: { chama_id: chamaId, is_active: true },
    });

    // Get next cycle number
    const lastCycle = await prisma.contributionCycle.findFirst({
      where: { chama_id: chamaId },
      orderBy: { cycle_number: 'desc' },
    });

    const cycleNumber = (lastCycle?.cycle_number || 0) + 1;

    // Create cycle with contributions for all members
    const cycle = await prisma.contributionCycle.create({
      data: {
        chama_id: chamaId,
        due_date: new Date(dueDate),
        amount,
        cycle_number: cycleNumber,
        status: new Date(dueDate) > new Date() ? 'UPCOMING' : 'OPEN',
        contributions: {
          create: members.map((m) => ({
            member_id: m.id,
            status: 'PENDING',
          })),
        },
      },
      include: {
        contributions: {
          include: {
            member: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    return cycle;
  }

  /**
   * Record a contribution payment
   */
  async recordPayment(contributionId: string, amount: number, mpesaRef?: string) {
    const contribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        amount_paid: amount,
        paid_at: new Date(),
        mpesa_ref: mpesaRef,
        status: 'PAID',
      },
      include: {
        member: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        cycle: {
          include: { chama: { select: { name: true } } },
        },
      },
    });

    await notificationService.notifyUser({
      userId: contribution.member.user.id,
      chamaId: contribution.cycle.chama_id,
      message: `Payment received for Cycle ${contribution.cycle.cycle_number} (${contribution.cycle.chama.name}). Amount: KES ${Number(amount).toLocaleString()}.`,
    });

    return contribution;
  }

  /**
   * Update contribution status (waive, mark late, etc.)
   */
  async updateStatus(contributionId: string, status: string, penaltyAmount?: number) {
    return prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: status as any,
        penalty_amount: penaltyAmount || 0,
      },
    });
  }

  /**
   * Get member contribution history
   */
  async getMemberHistory(memberId: string) {
    return prisma.contribution.findMany({
      where: { member_id: memberId },
      include: {
        cycle: {
          select: { due_date: true, amount: true, cycle_number: true },
        },
      },
      orderBy: { cycle: { due_date: 'desc' } },
    });
  }

  /**
   * Get contribution stats for a member in a chama
   */
  async getMemberStats(memberId: string) {
    const contributions = await prisma.contribution.findMany({
      where: { member_id: memberId },
    });

    const totalPaid = contributions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + Number(c.amount_paid), 0);

    const totalPenalties = contributions
      .reduce((sum, c) => sum + Number(c.penalty_amount), 0);

    const paidCount = contributions.filter((c) => c.status === 'PAID').length;
    const lateCount = contributions.filter((c) => c.status === 'LATE').length;
    const pendingCount = contributions.filter((c) => c.status === 'PENDING').length;

    // Calculate streak
    const sortedContributions = contributions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let streak = 0;
    for (const c of sortedContributions) {
      if (c.status === 'PAID') streak++;
      else break;
    }

    return {
      total_paid: totalPaid,
      total_penalties: totalPenalties,
      paid_count: paidCount,
      late_count: lateCount,
      pending_count: pendingCount,
      total_cycles: contributions.length,
      compliance_rate: contributions.length > 0
        ? Math.round((paidCount / contributions.length) * 100)
        : 0,
      current_streak: streak,
    };
  }

  /**
   * Auto-generate cycles for a chama based on its frequency
   */
  async generateCycles(chamaId: string, count: number = 1) {
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
    });

    if (!chama) throw new Error('Chama not found.');

    const lastCycle = await prisma.contributionCycle.findFirst({
      where: { chama_id: chamaId },
      orderBy: { due_date: 'desc' },
    });

    let nextDate = lastCycle
      ? new Date(lastCycle.due_date)
      : new Date(chama.start_date);

    const cycles = [];
    for (let i = 0; i < count; i++) {
      switch (chama.frequency) {
        case 'weekly':
          nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'biweekly':
          nextDate = new Date(nextDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
        default:
          nextDate = new Date(nextDate.setMonth(nextDate.getMonth() + 1));
          break;
      }

      const cycle = await this.createCycle(
        chamaId,
        nextDate.toISOString(),
        Number(chama.contribution_amount)
      );
      cycles.push(cycle);
    }

    return cycles;
  }
}

export const contributionService = new ContributionService();
