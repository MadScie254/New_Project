import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { normalizePhone, generateOTP } from '../utils/formatters';

const prisma = new PrismaClient();

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export class AuthService {
  /**
   * Register a new user with phone + PIN
   */
  async register(phone: string, pin: string, name: string) {
    const normalizedPhone = normalizePhone(phone);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      throw new Error('An account with this phone number already exists.');
    }

    // Hash the PIN
    const pin_hash = await bcrypt.hash(pin, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        pin_hash,
        name,
      },
    });

    // Generate OTP for verification
    const otp = generateOTP();
    otpStore.set(normalizedPhone, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    });

    console.log(`[DEV] OTP for ${normalizedPhone}: ${otp}`);

    // Generate token
    const token = generateToken({ userId: user.id, phone: user.phone });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
      token,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  /**
   * Login with phone + PIN
   */
  async login(phone: string, pin: string) {
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new Error('Invalid phone number or PIN.');
    }

    const isValid = await bcrypt.compare(pin, user.pin_hash);

    if (!isValid) {
      throw new Error('Invalid phone number or PIN.');
    }

    const token = generateToken({ userId: user.id, phone: user.phone });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photo_url: user.photo_url,
      },
      token,
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string) {
    const normalizedPhone = normalizePhone(phone);
    const stored = otpStore.get(normalizedPhone);

    if (!stored) {
      throw new Error('No OTP found. Please request a new one.');
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(normalizedPhone);
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (stored.otp !== otp) {
      throw new Error('Invalid OTP. Please try again.');
    }

    otpStore.delete(normalizedPhone);
    return { verified: true };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            chama: {
              select: { id: true, name: true, contribution_amount: true, frequency: true },
            },
          },
          where: { is_active: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      national_id: user.national_id,
      photo_url: user.photo_url,
      created_at: user.created_at,
      chamas: user.memberships.map((m) => ({
        id: m.chama.id,
        name: m.chama.name,
        role: m.role,
        contribution_amount: m.chama.contribution_amount,
        frequency: m.chama.frequency,
      })),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; national_id?: string; photo_url?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      national_id: user.national_id,
      photo_url: user.photo_url,
    };
  }
}

export const authService = new AuthService();
