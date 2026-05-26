import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationController {
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          chama: { select: { name: true } },
        },
      });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const count = await prisma.notification.count({
        where: { user_id: userId, read: false },
      });
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      await prisma.notification.update({
        where: { id: req.params.notificationId },
        data: { read: true },
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAllRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await prisma.notification.updateMany({
        where: { user_id: userId, read: false },
        data: { read: true },
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const notificationController = new NotificationController();
