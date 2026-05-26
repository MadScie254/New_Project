import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chama-os-dev-secret';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  phone: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
