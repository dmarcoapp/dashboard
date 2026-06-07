import { format } from 'date-fns';
import type { ApiDateObject } from '@/types/api';

/**
 * Parses an API date object into a JavaScript Date
 * The API returns dates as objects like:
 * { date: "2025-12-06 00:00:00.000000", timezone_type: 3, timezone: "UTC" }
 */
export function parseApiDate(apiDate: ApiDateObject | string | null): Date | null {
  if (!apiDate) return null;
  
  // If it's already a string (for backwards compatibility with mock data)
  if (typeof apiDate === 'string') {
    const parsed = new Date(apiDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Handle the API date object format
  if (apiDate.date) {
    // The API date format is "YYYY-MM-DD HH:mm:ss.ffffff"
    // Convert to ISO format for parsing
    const isoString = apiDate.date.replace(' ', 'T') + 'Z';
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

/**
 * Formats a Date object into a human-readable string
 */
export function formatDate(date: Date | null, formatStr: string = 'MMM d, yyyy HH:mm'): string {
  if (!date) return 'N/A';
  return format(date, formatStr);
}
