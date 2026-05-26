import { Request, Response } from 'express';
import { chamaService } from '../services/chama.service';

export class ChamaController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const chama = await chamaService.createChama(userId, req.body);
      res.status(201).json(chama);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserChamas(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const chamas = await chamaService.getUserChamas(userId);
      res.json(chamas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const chama = await chamaService.getChamaDetails(req.params.chamaId);
      res.json(chama);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async joinByInvite(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const result = await chamaService.joinByInviteCode(userId, req.body.inviteCode);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async inviteMember(req: Request, res: Response) {
    try {
      const result = await chamaService.inviteMember(req.params.chamaId, req.body.phone);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const result = await chamaService.updateMemberRole(
        req.params.chamaId,
        req.params.memberId,
        req.body.role
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getWallet(req: Request, res: Response) {
    try {
      const wallet = await chamaService.getWalletBalance(req.params.chamaId);
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      const dashboard = await chamaService.getDashboard(req.params.chamaId);
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateChama(req: Request, res: Response) {
    try {
      const chama = await chamaService.updateChama(req.params.chamaId, req.body);
      res.json(chama);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const chamaController = new ChamaController();
