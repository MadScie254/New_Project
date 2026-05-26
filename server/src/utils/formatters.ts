/**
 * Format a number as KES currency
 */
export function formatKES(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Validate Kenyan phone number and normalize to 254XXXXXXXXX format
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }

  if (!/^254[0-9]{9}$/.test(cleaned)) {
    throw new Error('Invalid Kenyan phone number. Use format: +254XXXXXXXXX');
  }

  return cleaned;
}

/**
 * Format phone for display as +254 XXX XXXXXX
 */
export function formatPhone(phone: string): string {
  const normalized = phone.replace(/^\+/, '');
  if (normalized.length === 12 && normalized.startsWith('254')) {
    return `+254 ${normalized.substring(3, 6)} ${normalized.substring(6)}`;
  }
  return phone;
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a human-readable invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
