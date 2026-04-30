import { format } from 'date-fns';
import { enUS, nb } from 'date-fns/locale';

import type { Locale } from 'date-fns';

export * from 'date-fns';

const localeMap: Record<string, Locale> = {
  nb,
  en: enUS,
};

let currentLocale = 'en';

/**
 * Set the global locale used by all date formatting functions.
 * Call this when the user switches language (e.g. from useLocale hook).
 */
export function setDateLocale(locale: string) {
  currentLocale = locale;
}

export function getDateLocale() {
  return currentLocale;
}

function getLocale(locale?: string) {
  return localeMap[locale ?? currentLocale] ?? enUS;
}

const TZ_RE = /([+-]\d{2}:?\d{2}|Z)$/;

/**
 * Convert a string or Date to a proper Date object.
 * DB timestamps come without timezone info (e.g. "2026-04-16 14:00:00").
 * We treat those as UTC by appending "Z" so the browser correctly
 * converts to the user's local timezone.
 */
function toDate(date: string | Date) {
  if (date instanceof Date) return date;
  const trimmed = date.trim();
  if (TZ_RE.test(trimmed)) return new Date(trimmed);
  return new Date(`${trimmed}Z`);
}

export function formatOrdinalDate(date: Date, locale?: string) {
  const dayOfMonth = date.getDate();
  const ordinal =
    dayOfMonth % 10 === 1 && dayOfMonth !== 11
      ? 'st'
      : dayOfMonth % 10 === 2 && dayOfMonth !== 12
        ? 'nd'
        : dayOfMonth % 10 === 3 && dayOfMonth !== 13
          ? 'rd'
          : 'th';

  return `${format(date, 'MMM', { locale: getLocale(locale) })} ${dayOfMonth}${ordinal}, ${format(date, 'yyyy')}`;
}

export function formatShortDate(date: string | Date, locale?: string) {
  return format(toDate(date), 'MMM d, yyyy', { locale: getLocale(locale) });
}

export function formatFullDate(date: string | Date, locale?: string) {
  return format(toDate(date), 'MMMM d, yyyy', { locale: getLocale(locale) });
}

export function formatTime(date: string | Date) {
  return format(toDate(date), 'HH:mm');
}

export function formatDateTime(date: string | Date, locale?: string) {
  const d = toDate(date);
  return `${format(d, 'MMM d, yyyy', { locale: getLocale(locale) })} ${format(d, 'HH:mm')}`;
}

export function formatMonthYear(date: string | Date, locale?: string) {
  return format(toDate(date), 'MMMM yyyy', { locale: getLocale(locale) });
}

/**
 * Today as an ISO date string (YYYY-MM-DD) in the user's local timezone.
 * Use for default form values where the API expects a date-only string.
 */
export function todayISODate() {
  return toISODate(new Date());
}

/**
 * Convert a Date to a YYYY-MM-DD string using local-timezone components.
 * Avoids the UTC shift that `toISOString().slice(0, 10)` causes near
 * midnight boundaries.
 */
export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local-timezone Date. Returns `undefined`
 * for empty or malformed input — convenient for controlled form fields that
 * may hold an empty string.
 */
export function parseISODate(value: string | null | undefined) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}
