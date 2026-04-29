import { useCallback, useMemo } from 'react';

import { parseAsString, useQueryState } from 'nuqs';

import {
  endOfDay,
  format,
  intervalToDuration,
  parse,
  startOfDay,
  subDays,
} from '@repo/utils/date';

export function useDateRange(timeRange: number = 14) {
  const defaultFrom = format(
    startOfDay(subDays(new Date(), timeRange)),
    'yyyy-MM-dd',
  );
  const defaultTo = format(endOfDay(new Date()), 'yyyy-MM-dd');

  const [from, setFrom] = useQueryState(
    'from',
    parseAsString.withDefault(defaultFrom),
  );
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(defaultTo));

  const dateRange = useMemo(() => {
    const fromDate = parse(from, 'yyyy-MM-dd', new Date());
    const toDate = parse(to, 'yyyy-MM-dd', new Date());
    return { from: fromDate, to: toDate };
  }, [from, to]);

  const dateRangeInString = useMemo(() => {
    return {
      from,
      to,
    };
  }, [from, to]);

  const setDateRange = useCallback(
    (fromDate: Date, toDate: Date) => {
      const formattedFrom = format(fromDate, 'yyyy-MM-dd');
      const formattedTo = format(toDate, 'yyyy-MM-dd');

      setFrom(formattedFrom);
      setTo(formattedTo);
    },
    [setFrom, setTo],
  );

  const intervalDays = useMemo(() => {
    const interval = intervalToDuration({
      start: dateRange.from,
      end: dateRange.to,
    });

    return interval.days;
  }, [dateRange.from, dateRange.to]);

  return { dateRange, dateRangeInString, setDateRange, intervalDays };
}
