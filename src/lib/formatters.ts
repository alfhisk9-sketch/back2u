import { CAMPUS_CONFIG } from './constants';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a date string or timestamp into the standard DNR format: DD MMM YYYY (e.g., 24 Oct 2026)
 */
export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats a date relative to now or falls back to DD MMM YYYY
 */
export function formatRelativeDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}

/**
 * Formats an amount into Indian Rupee (₹)
 */
export function formatCurrency(amount: number): string {
  return `${CAMPUS_CONFIG.currencySymbol}${amount.toLocaleString('en-IN')}`;
}
