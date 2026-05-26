import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { phone, pin, name } = req.body;
      const result = await authService.register(phone, pin, name);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { phone, pin } = req.body;
      const result = await authService.login(phone, pin);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;
      const result = await authService.verifyOTP(phone, otp);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const result = await authService.updateProfile(userId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
