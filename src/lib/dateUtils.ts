import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Parses a YYYY-MM-DD string into a Date object at local midnight.
 * This avoids the common issue where `new Date('YYYY-MM-DD')` is treated as UTC midnight,
 * causing it to appear as the previous day in western timezones.
 */
export function parseLocalDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  
  // Handle case where dateStr might already be a DateISO string or have time
  const [datePart] = dateStr.includes('T') ? dateStr.split('T') : [dateStr];
  const parts = datePart.split('-');
  
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed months
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  return isValid(date) ? date : null;
}

/**
 * Formats a YYYY-MM-DD string into a human-readable format, handling timezone issues.
 * Default format is 'dd MMM' (e.g., '27 Mar').
 */
export function formatLocalDate(
  dateStr: string | undefined | null, 
  formatStr: string = 'dd MMM',
  locale: any = es
): string {
  if (!dateStr) return '-';
  
  const date = parseLocalDate(dateStr);
  if (!date) return '-';
  
  try {
    return format(date, formatStr, { locale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Safely compares if a due date (YYYY-MM-DD) is today or in the past.
 */
export function isOverdue(dueDate: string | undefined | null): boolean {
  if (!dueDate) return false;
  
  const due = parseLocalDate(dueDate);
  if (!due) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return due < today;
}
