import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import type { ApiDateObject } from '@/types/api';
import { parseApiDate } from '@/lib/date-utils';

interface DateTimeDisplayProps {
  date: ApiDateObject | string | Date | null;
  formatStr?: string;
  showTimezone?: boolean;
  className?: string;
}

/**
 * Displays a datetime with timezone suffix and hover tooltip showing local time.
 * - Renders the time in the original timezone (UTC if not specified)
 * - Tooltip shows the time converted to user's local browser timezone
 */
export function DateTimeDisplay({ 
  date, 
  formatStr = 'MMM d, yyyy HH:mm',
  showTimezone = true,
  className 
}: DateTimeDisplayProps) {
  // Parse the date
  let parsedDate: Date | null = null;
  let sourceTimezone = 'UTC';
  
  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === 'string') {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) parsedDate = null;
  } else if (date && typeof date === 'object' && 'date' in date) {
    parsedDate = parseApiDate(date);
    sourceTimezone = date.timezone || 'UTC';
  }
  
  if (!parsedDate) {
    return <span className={className}>N/A</span>;
  }
  
  // Format in source timezone
  const formattedUtc = formatInTimeZone(parsedDate, sourceTimezone, formatStr);
  const tzAbbrev = sourceTimezone === 'UTC' ? 'UTC' : sourceTimezone;
  
  // Format in user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedLocal = formatInTimeZone(parsedDate, userTimezone, `${formatStr} (zzz)`);
  
  const displayText = showTimezone ? `${formattedUtc} ${tzAbbrev}` : formattedUtc;
  
  // Only show tooltip if local timezone differs from source
  const showTooltip = userTimezone !== sourceTimezone;
  
  if (!showTooltip) {
    return <span className={className}>{displayText}</span>;
  }
  
  return (
    <TouchTooltip content={<p>{formattedLocal}</p>} side="top" className="text-xs">
      <span className={`cursor-help ${className || ''}`}>{displayText}</span>
    </TouchTooltip>
  );
}

/**
 * Displays a date range with timezone info
 */
interface DateRangeDisplayProps {
  startDate: ApiDateObject | string | Date | null;
  endDate: ApiDateObject | string | Date | null;
  formatStr?: string;
  className?: string;
}

export function DateRangeDisplay({
  startDate,
  endDate,
  formatStr = 'MMM d',
  className
}: DateRangeDisplayProps) {
  // Parse dates
  const parseDate = (d: ApiDateObject | string | Date | null): { date: Date | null; tz: string } => {
    if (!d) return { date: null, tz: 'UTC' };
    if (d instanceof Date) return { date: d, tz: 'UTC' };
    if (typeof d === 'string') {
      const parsed = new Date(d);
      return { date: isNaN(parsed.getTime()) ? null : parsed, tz: 'UTC' };
    }
    return { date: parseApiDate(d), tz: d.timezone || 'UTC' };
  };
  
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start.date || !end.date) {
    return <span className={className}>-</span>;
  }
  
  const sourceTimezone = end.tz;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format dates
  const startFormatted = formatInTimeZone(start.date, sourceTimezone, formatStr);
  const endFormatted = formatInTimeZone(end.date, sourceTimezone, `${formatStr}, yyyy`);
  const tzAbbrev = sourceTimezone === 'UTC' ? 'UTC' : sourceTimezone;
  
  const displayText = `${startFormatted} - ${endFormatted} ${tzAbbrev}`;
  
  // Local time formatting for tooltip
  const startLocal = formatInTimeZone(start.date, userTimezone, `${formatStr}, yyyy HH:mm (zzz)`);
  const endLocal = formatInTimeZone(end.date, userTimezone, `${formatStr}, yyyy HH:mm (zzz)`);
  
  const showTooltip = userTimezone !== sourceTimezone;
  
  if (!showTooltip) {
    return <span className={className}>{displayText}</span>;
  }
  
  return (
    <TouchTooltip content={<p>{startLocal} – {endLocal}</p>} side="top" className="text-xs">
      <span className={`cursor-help ${className || ''}`}>{displayText}</span>
    </TouchTooltip>
  );
}
