import { DateTime } from 'luxon';
import { DATETIME_FORMAT, TASHKENT_TIMEZONE } from '../config/constants';

const FALLBACK_FORMAT = 'dd.MM.yy HH:mm';

/** Parses "dd.mm.yyyy hh:mm" (or "dd.mm.yy hh:mm") as Tashkent local time. Null if invalid. */
export function parseTashkentDateTime(input: string): Date | null {
  const trimmed = input.trim();
  const primary = DateTime.fromFormat(trimmed, DATETIME_FORMAT, { zone: TASHKENT_TIMEZONE });
  if (primary.isValid) return primary.toJSDate();

  const fallback = DateTime.fromFormat(trimmed, FALLBACK_FORMAT, { zone: TASHKENT_TIMEZONE });
  if (fallback.isValid) return fallback.toJSDate();

  return null;
}

export function formatTashkentDateTime(date: Date): string {
  return DateTime.fromJSDate(date).setZone(TASHKENT_TIMEZONE).toFormat(DATETIME_FORMAT);
}

export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/** Builds "Examples:" text with times relative to now, in the same format users must type. */
export function buildDatetimeExamples(): string {
  const now = DateTime.now().setZone(TASHKENT_TIMEZONE);
  const lines = [
    `${now.plus({ minutes: 10 }).toFormat(DATETIME_FORMAT)} - in 10 minutes`,
    `${now.plus({ hours: 1 }).toFormat(DATETIME_FORMAT)} - in an hour`,
    `${now.plus({ days: 1 }).toFormat(DATETIME_FORMAT)} - in a day`,
    `${now.plus({ weeks: 1 }).toFormat(DATETIME_FORMAT)} - in a week`,
  ];
  return `Examples:\n\n${lines.join('\n')}`;
}
