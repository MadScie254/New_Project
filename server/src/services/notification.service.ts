import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  async notifyUser(params: { userId: string; message: string; chamaId?: string }) {
    return prisma.notification.create({
      data: {
        user_id: params.userId,
        chama_id: params.chamaId,
        message: params.message,
      },
    });
  }
}

export const notificationService = new NotificationService();
