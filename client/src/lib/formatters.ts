import { format, parseISO } from 'date-fns';

/**
 * Format a number as KES currency
 */
export function formatKES(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format date nicely
 */
export function formatDate(dateString: string | Date, withTime = false): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, withTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy');
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
 * Get initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
