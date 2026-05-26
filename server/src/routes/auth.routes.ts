import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/auth.controller';
import { authGuard } from '../middleware/auth.guard';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must be 4 digits'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits'),
});

const otpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

router.post('/register', validate({ body: registerSchema }), (req, res) => authController.register(req, res));
router.post('/login', validate({ body: loginSchema }), (req, res) => authController.login(req, res));
router.post('/verify-otp', validate({ body: otpSchema }), (req, res) => authController.verifyOTP(req, res));
router.get('/me', authGuard, (req, res) => authController.getProfile(req, res));
router.put('/profile', authGuard, (req, res) => authController.updateProfile(req, res));

export default router;
