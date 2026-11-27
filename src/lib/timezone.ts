import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '@/contexts/AuthContext';
import { platformService } from '@/services/platform-service';

export const UTC = 'UTC';

// The Platform page writes the settings it saves under this key, so every date
// on screen follows a new time zone at once.
export const PLATFORM_SETTINGS_QUERY_KEY = ['platform', 'settings'] as const;

/**
 * The time zone the dashboard shows dates and times in, set on the Platform
 * page. UTC until the settings are loaded, and when nothing else is set.
 */
export function useDisplayTimezone(): string {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: PLATFORM_SETTINGS_QUERY_KEY,
    queryFn: () => platformService.getSettings(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const timezone = data?.displayTimezone || UTC;
  return isSupportedTimezone(timezone) ? timezone : UTC;
}

/**
 * The server accepts a few old zone names a browser may not know, and
 * formatting a date in one of those would throw.
 */
export function isSupportedTimezone(timezone: string): boolean {
  try {
    nameFormatter('en-US', timezone);
    return true;
  } catch {
    return false;
  }
}

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || UTC;
}

/**
 * The time zones the browser knows, UTC first.
 */
export function listTimezones(): string[] {
  // ES2022's Intl.supportedValuesOf, which the project's TypeScript lib predates.
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  const zones = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
  return [UTC, ...zones.filter((zone) => zone !== UTC)];
}

// A table of dates would otherwise build two formatters for every cell.
const nameFormatters = new Map<string, Intl.DateTimeFormat>();

function nameFormatter(locale: string, timezone: string): Intl.DateTimeFormat {
  const key = `${locale}|${timezone}`;
  let formatter = nameFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { timeZone: timezone, timeZoneName: 'short' });
    nameFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * The short name of a time zone at a moment, such as CET or CEST. US English
 * names American zones and British English European ones; a zone neither has a
 * name for gets its offset, such as GMT+9.
 */
export function timezoneAbbreviation(date: Date, timezone: string): string {
  if (timezone === UTC) return UTC;

  let fallback = '';
  for (const locale of ['en-US', 'en-GB']) {
    const name = nameFormatter(locale, timezone)
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;
    if (!name) continue;
    if (!/^(GMT|UTC)[+-]/.test(name)) return name;
    fallback ||= name;
  }
  return fallback || timezone;
}

/**
 * A moment in a time zone, followed by the zone's short name.
 */
export function formatWithTimezone(date: Date, timezone: string, formatStr: string): string {
  return `${formatInTimeZone(date, timezone, formatStr)} ${timezoneAbbreviation(date, timezone)}`;
}
