import { useCallback, useState } from 'react';

interface UseChartFiltersOptions {
  initialMonth?: number;
  initialYear?: number;
}

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR = now.getFullYear();

export function useChartFilters(options: UseChartFiltersOptions = {}) {
  const [month, setMonthState] = useState(
    options.initialMonth ?? DEFAULT_MONTH,
  );
  const [year, setYearState] = useState(options.initialYear ?? DEFAULT_YEAR);

  const setMonth = useCallback((value: number) => {
    setMonthState(value);
  }, []);

  const setYear = useCallback((value: number) => {
    setYearState(value);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    if (month === 1) {
      setMonthState(12);
      setYearState((y) => y - 1);
    } else {
      setMonthState((m) => m - 1);
    }
  }, [month]);

  const goToNextMonth = useCallback(() => {
    if (month === 12) {
      setMonthState(1);
      setYearState((y) => y + 1);
    } else {
      setMonthState((m) => m + 1);
    }
  }, [month]);

  return {
    month,
    year,
    setMonth,
    setYear,
    goToPreviousMonth,
    goToNextMonth,
  };
}
