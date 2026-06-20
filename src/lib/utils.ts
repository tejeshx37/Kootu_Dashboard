import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  'Food & Dining',
  'Fashion',
  'Electronics',
  'Travel',
  'Beauty',
  'Health',
  'Entertainment',
  'Shopping',
] as const;

export function formatDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
