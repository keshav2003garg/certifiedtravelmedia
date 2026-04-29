import {
  endOfDay,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from '@repo/utils/date';
import { z } from '@repo/utils/zod';

export const dateValidator = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional();

export const dateRangeSchema = z.object({
  from: dateValidator,
  to: dateValidator,
});

function isValidDateString(dateStr?: string) {
  if (!dateStr) return true;
  const date = parseISO(dateStr);
  return isValid(date);
}

export function dateRangeRefine(
  data: { from?: string | null; to?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.from && !isValidDateString(data.from)) {
    ctx.addIssue({
      code: 'custom',
      message: 'From date is not a valid date',
      path: ['from'],
    });
  }

  if (data.to && !isValidDateString(data.to)) {
    ctx.addIssue({
      code: 'custom',
      message: 'To date is not a valid date',
      path: ['to'],
    });
  }

  if (ctx.issues.length > 0) {
    return;
  }

  if (data.from && data.to) {
    const fromDate = parseISO(data.from);
    const toDate = parseISO(data.to);

    if (fromDate > toDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'From date cannot be after to date',
        path: ['from'],
      });
    }
  }
}

export function createDateRangeTransform<
  T extends { from?: string | null; to?: string | null },
>(interval: number = 7) {
  return function (data: T): Omit<T, 'from' | 'to'> & { from: Date; to: Date } {
    let fromDate: Date;
    let toDate: Date;

    if (data.from && data.to) {
      fromDate = parseISO(data.from);
      toDate = parseISO(data.to);
    } else if (!data.from && !data.to) {
      toDate = new Date();
      fromDate = subDays(startOfDay(toDate), interval);
    } else if (data.from && !data.to) {
      fromDate = parseISO(data.from);
      toDate = new Date();
    } else if (!data.from && data.to) {
      toDate = parseISO(data.to);
      fromDate = subDays(startOfDay(toDate), interval);
    } else {
      toDate = new Date();
      fromDate = subDays(startOfDay(toDate), interval);
    }

    return {
      ...data,
      from: startOfDay(fromDate),
      to: endOfDay(toDate),
    };
  };
}
