import { useCallback, useMemo } from 'react';

import { parseAsInteger, useQueryStates } from '@repo/hooks/nuqs';

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR = now.getFullYear();

function normalizeMonth(value: number) {
  if (value < 1) return 1;
  if (value > 12) return 12;
  return value;
}

function isValidYear(value: number) {
  return value >= 2020 && value <= 2100;
}

export function useChartFilters() {
  const [{ month, year }, setPeriod] = useQueryStates({
    month: parseAsInteger.withDefault(DEFAULT_MONTH),
    year: parseAsInteger.withDefault(DEFAULT_YEAR),
  });

  const handleMonthChange = useCallback(
    (value: number) => {
      const nextMonth = normalizeMonth(value);
      setPeriod({ month: nextMonth === DEFAULT_MONTH ? null : nextMonth });
    },
    [setPeriod],
  );

  const handleYearChange = useCallback(
    (value: number) => {
      if (!isValidYear(value)) return;
      setPeriod({ year: value === DEFAULT_YEAR ? null : value });
    },
    [setPeriod],
  );

  const handlePeriodChange = useCallback(
    (nextMonth: number, nextYear: number) => {
      const normalizedMonth = normalizeMonth(nextMonth);
      if (!isValidYear(nextYear)) return;

      setPeriod({
        month: normalizedMonth === DEFAULT_MONTH ? null : normalizedMonth,
        year: nextYear === DEFAULT_YEAR ? null : nextYear,
      });
    },
    [setPeriod],
  );

  const goToPreviousMonth = useCallback(() => {
    if (month === 1) {
      handlePeriodChange(12, year - 1);
    } else {
      handlePeriodChange(month - 1, year);
    }
  }, [handlePeriodChange, month, year]);

  const goToNextMonth = useCallback(() => {
    if (month === 12) {
      handlePeriodChange(1, year + 1);
    } else {
      handlePeriodChange(month + 1, year);
    }
  }, [handlePeriodChange, month, year]);

  const params = useMemo(
    () => ({
      month,
      year,
    }),
    [month, year],
  );

  return {
    month,
    year,
    setMonth: handleMonthChange,
    setYear: handleYearChange,
    handleMonthChange,
    handleYearChange,
    handlePeriodChange,
    goToPreviousMonth,
    goToNextMonth,
    params,
  };
}
