import { useCallback, useMemo } from 'react';

import {
  differenceInDays,
  endOfDay,
  endOfYear,
  startOfDay,
  startOfYear,
  subDays,
  subYears,
} from '@repo/utils/date';

export type PresetValue = '7d' | '14d' | '30d' | '1y' | 'prev_year' | 'custom';

export interface DatePresetOption {
  value: PresetValue;
  label: string;
  days: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface UseDatePresetsProps {
  dateRange: DateRange;
  setDateRange: (from: Date, to: Date) => void;
}

export const presetOptions = [
  { value: '7d' as const, label: 'Last 7 days', days: 7 },
  { value: '14d' as const, label: 'Last 14 days', days: 14 },
  { value: '30d' as const, label: 'Last 30 days', days: 30 },
  { value: '1y' as const, label: 'Last year', days: 365 },
  { value: 'prev_year' as const, label: 'Previous year', days: 0 },
] as const satisfies readonly DatePresetOption[];

export function useDatePresets({
  dateRange,
  setDateRange,
}: UseDatePresetsProps) {
  const currentPreset = useMemo<PresetValue>(() => {
    const now = new Date();
    const today = endOfDay(now);

    const lastYear = now.getFullYear() - 1;
    const prevYearStart = startOfYear(new Date(lastYear, 0, 1));
    const prevYearEnd = endOfYear(new Date(lastYear, 11, 31));

    if (
      Math.abs(differenceInDays(dateRange.from, prevYearStart)) <= 1 &&
      Math.abs(differenceInDays(dateRange.to, prevYearEnd)) <= 1
    ) {
      return 'prev_year';
    }

    for (const preset of presetOptions) {
      if (preset.value === 'prev_year') continue;

      const expectedFrom = startOfDay(subDays(now, preset.days - 1));
      if (
        Math.abs(differenceInDays(dateRange.from, expectedFrom)) <= 1 &&
        Math.abs(differenceInDays(dateRange.to, today)) <= 1
      ) {
        return preset.value;
      }
    }

    return 'custom';
  }, [dateRange]);

  const handlePresetChange = useCallback(
    (preset: string) => {
      const presetValue = preset as PresetValue;
      const now = new Date();

      let fromDate: Date;
      let toDate: Date;

      const lastYear = now.getFullYear() - 1;

      switch (presetValue) {
        case '7d':
          fromDate = startOfDay(subDays(now, 6));
          toDate = endOfDay(now);
          break;
        case '14d':
          fromDate = startOfDay(subDays(now, 13));
          toDate = endOfDay(now);
          break;
        case '30d':
          fromDate = startOfDay(subDays(now, 29));
          toDate = endOfDay(now);
          break;
        case '1y':
          fromDate = startOfDay(subYears(now, 1));
          toDate = endOfDay(now);
          break;
        case 'prev_year':
          fromDate = startOfYear(new Date(lastYear, 0, 1));
          toDate = endOfYear(new Date(lastYear, 11, 31));
          break;
        case 'custom':
          // Custom preset doesn't change dates — handled by parent
          return;
        default:
          fromDate = startOfDay(subDays(now, 29));
          toDate = endOfDay(now);
      }

      setDateRange(fromDate, toDate);
    },
    [setDateRange],
  );

  const getDisplayText = useCallback((): string => {
    const preset = presetOptions.find((p) => p.value === currentPreset);
    return preset?.label || 'Last 30 days';
  }, [currentPreset]);

  const totalDays = useMemo(() => {
    return (
      Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    );
  }, [dateRange]);

  return {
    presetOptions,
    currentPreset,
    handlePresetChange,
    getDisplayText,
    totalDays,
  };
}
