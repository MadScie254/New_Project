import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MeetingController {
  async create(req: Request, res: Response) {
    try {
      const meeting = await prisma.meeting.create({
        data: {
          chama_id: req.params.chamaId,
          scheduled_at: new Date(req.body.scheduledAt),
          location: req.body.location,
          agenda: req.body.agenda,
        },
      });
      res.status(201).json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const meetings = await prisma.meeting.findMany({
        where: { chama_id: req.params.chamaId },
        include: {
          attendance: {
            include: {
              member: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          _count: { select: { attendance: true } },
        },
        orderBy: { scheduled_at: 'desc' },
      });
      res.json(meetings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: req.params.meetingId },
        include: {
          attendance: {
            include: {
              member: {
                include: { user: { select: { id: true, name: true, phone: true, photo_url: true } } },
              },
            },
          },
          chama: { select: { name: true } },
        },
      });

      if (!meeting) {
        res.status(404).json({ error: 'Meeting not found.' });
        return;
      }

      res.json(meeting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAttendance(req: Request, res: Response) {
    try {
      const { memberId, status, fineAmount } = req.body;

      const attendance = await prisma.meetingAttendance.upsert({
        where: {
          meeting_id_member_id: {
            meeting_id: req.params.meetingId,
            member_id: memberId,
          },
        },
        update: {
          status,
          fine_amount: fineAmount || 0,
        },
        create: {
          meeting_id: req.params.meetingId,
          member_id: memberId,
          status,
          fine_amount: fineAmount || 0,
        },
      });

      // Create fine record if absent
      if (status === 'ABSENT' && fineAmount > 0) {
        const meeting = await prisma.meeting.findUnique({
          where: { id: req.params.meetingId },
        });

        await prisma.fine.create({
          data: {
            chama_id: meeting!.chama_id,
            member_id: memberId,
            reason: 'Meeting absence fine',
            amount: fineAmount,
          },
        });
      }

      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async saveMinutes(req: Request, res: Response) {
    try {
      const meeting = await prisma.meeting.update({
        where: { id: req.params.meetingId },
        data: {
          minutes: req.body.minutes,
          status: 'COMPLETED',
        },
      });
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const meeting = await prisma.meeting.update({
        where: { id: req.params.meetingId },
        data: {
          scheduled_at: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
          location: req.body.location,
          agenda: req.body.agenda,
          status: req.body.status,
        },
      });
      res.json(meeting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await prisma.meeting.delete({
        where: { id: req.params.meetingId },
      });
      res.json({ message: 'Meeting deleted.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const meetingController = new MeetingController();
