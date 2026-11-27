import { formatInTimeZone } from 'date-fns-tz';
import { TouchTooltip } from '@/components/ui/touch-tooltip';
import type { ApiDateObject } from '@/types/api';
import { parseApiDate } from '@/lib/date-utils';
import { UTC, browserTimezone, formatWithTimezone, useDisplayTimezone } from '@/lib/timezone';

type DateInput = ApiDateObject | string | Date | null;

// The API sends every date in UTC.
function toDate(date: DateInput): Date | null {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return parseApiDate(date);
}

/**
 * The zone the tooltip shows a date in: UTC while the dashboard shows another
 * zone, and the browser's own zone while it shows UTC. Null when that is the
 * zone already on screen.
 */
function tooltipTimezone(displayTimezone: string): string | null {
  const other = displayTimezone === UTC ? browserTimezone() : UTC;
  return other === displayTimezone ? null : other;
}

interface DateTimeDisplayProps {
  date: DateInput;
  formatStr?: string;
  showTimezone?: boolean;
  className?: string;
}

/**
 * A date and time in the time zone set on the Platform page, with the same
 * moment in UTC on hover. While that zone is UTC, the hover shows the
 * browser's own zone instead.
 */
export function DateTimeDisplay({
  date,
  formatStr = 'MMM d, yyyy HH:mm',
  showTimezone = true,
  className,
}: DateTimeDisplayProps) {
  const displayTimezone = useDisplayTimezone();
  const parsedDate = toDate(date);

  if (!parsedDate) {
    return <span className={className}>N/A</span>;
  }

  const displayText = showTimezone
    ? formatWithTimezone(parsedDate, displayTimezone, formatStr)
    : formatInTimeZone(parsedDate, displayTimezone, formatStr);

  const hoverTimezone = tooltipTimezone(displayTimezone);
  if (!hoverTimezone) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <TouchTooltip content={<p>{formatWithTimezone(parsedDate, hoverTimezone, formatStr)}</p>} side="top" className="text-xs">
      <span className={`cursor-help ${className || ''}`}>{displayText}</span>
    </TouchTooltip>
  );
}

interface DateRangeDisplayProps {
  startDate: DateInput;
  endDate: DateInput;
  formatStr?: string;
  className?: string;
}

/**
 * A date range in the time zone set on the Platform page, with its exact
 * start and end in UTC on hover, or in the browser's zone while that is UTC.
 */
export function DateRangeDisplay({
  startDate,
  endDate,
  formatStr = 'MMM d',
  className,
}: DateRangeDisplayProps) {
  const displayTimezone = useDisplayTimezone();
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start || !end) {
    return <span className={className}>-</span>;
  }

  const startFormatted = formatInTimeZone(start, displayTimezone, formatStr);
  const endFormatted = formatWithTimezone(end, displayTimezone, `${formatStr}, yyyy`);
  const displayText = `${startFormatted} - ${endFormatted}`;

  const hoverTimezone = tooltipTimezone(displayTimezone);
  if (!hoverTimezone) {
    return <span className={className}>{displayText}</span>;
  }

  const exact = `${formatStr}, yyyy HH:mm`;
  return (
    <TouchTooltip
      content={<p>{formatWithTimezone(start, hoverTimezone, exact)} – {formatWithTimezone(end, hoverTimezone, exact)}</p>}
      side="top"
      className="text-xs"
    >
      <span className={`cursor-help ${className || ''}`}>{displayText}</span>
    </TouchTooltip>
  );
}
