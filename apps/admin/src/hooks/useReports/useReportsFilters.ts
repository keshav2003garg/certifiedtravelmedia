import { useCallback, useMemo } from 'react';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';

const currentDate = new Date();
const DEFAULT_MONTH = currentDate.getMonth() + 1;
const DEFAULT_YEAR = currentDate.getFullYear();
const REPORT_TAB_OPTIONS = ['month-end', 'year-end'] as const;

export type ReportTab = (typeof REPORT_TAB_OPTIONS)[number];

function normalizeMonth(value: number) {
  if (value < 1) return 1;
  if (value > 12) return 12;
  return value;
}

function normalizeYear(value: number) {
  if (value < 2000) return 2000;
  if (value > 2100) return 2100;
  return value;
}

export function useReportsFilters() {
  const [tab, setTab] = useQueryState(
    'reportTab',
    parseAsStringLiteral(REPORT_TAB_OPTIONS),
  );
  const [monthlyWarehouseId, setMonthlyWarehouseId] = useQueryState(
    'monthlyWarehouseId',
    parseAsString,
  );
  const [monthlyMonth, setMonthlyMonth] = useQueryState(
    'monthlyMonth',
    parseAsInteger.withDefault(DEFAULT_MONTH),
  );
  const [monthlyYear, setMonthlyYear] = useQueryState(
    'monthlyYear',
    parseAsInteger.withDefault(DEFAULT_YEAR),
  );
  const [yearlyCustomerId, setYearlyCustomerId] = useQueryState(
    'yearlyCustomerId',
    parseAsString,
  );
  const [yearlyYear, setYearlyYear] = useQueryState(
    'yearlyYear',
    parseAsInteger.withDefault(DEFAULT_YEAR),
  );
  const activeTab = tab ?? 'month-end';

  const handleTabChange = useCallback(
    (value: string) => {
      const nextTab = REPORT_TAB_OPTIONS.includes(value as ReportTab)
        ? (value as ReportTab)
        : 'month-end';

      setTab(nextTab === 'month-end' ? null : nextTab);
    },
    [setTab],
  );

  const handleMonthlyWarehouseChange = useCallback(
    (value: string | null) => {
      setMonthlyWarehouseId(value);
    },
    [setMonthlyWarehouseId],
  );

  const handleMonthlyMonthChange = useCallback(
    (value: number) => {
      const nextMonth = normalizeMonth(value);
      setMonthlyMonth(nextMonth === DEFAULT_MONTH ? null : nextMonth);
    },
    [setMonthlyMonth],
  );

  const handleMonthlyYearChange = useCallback(
    (value: number | undefined) => {
      if (!value) return;

      const nextYear = normalizeYear(value);
      setMonthlyYear(nextYear === DEFAULT_YEAR ? null : nextYear);
    },
    [setMonthlyYear],
  );

  const handleYearlyCustomerChange = useCallback(
    (value: string | null) => {
      setYearlyCustomerId(value);
    },
    [setYearlyCustomerId],
  );

  const handleYearlyYearChange = useCallback(
    (value: number | undefined) => {
      if (!value) return;

      const nextYear = normalizeYear(value);
      setYearlyYear(nextYear === DEFAULT_YEAR ? null : nextYear);
    },
    [setYearlyYear],
  );

  const clearMonthlyFilters = useCallback(() => {
    setMonthlyWarehouseId(null);
    setMonthlyMonth(null);
    setMonthlyYear(null);
  }, [setMonthlyWarehouseId, setMonthlyMonth, setMonthlyYear]);

  const clearYearlyFilters = useCallback(() => {
    setYearlyCustomerId(null);
    setYearlyYear(null);
  }, [setYearlyCustomerId, setYearlyYear]);

  const monthlyHasActiveFilters = useMemo(
    () =>
      Boolean(
        monthlyWarehouseId ||
        monthlyMonth !== DEFAULT_MONTH ||
        monthlyYear !== DEFAULT_YEAR,
      ),
    [monthlyWarehouseId, monthlyMonth, monthlyYear],
  );

  const yearlyHasActiveFilters = useMemo(
    () => Boolean(yearlyCustomerId || yearlyYear !== DEFAULT_YEAR),
    [yearlyCustomerId, yearlyYear],
  );

  const monthlyParams = useMemo(
    () => ({
      warehouseId: monthlyWarehouseId ?? undefined,
      month: monthlyMonth,
      year: monthlyYear,
    }),
    [monthlyWarehouseId, monthlyMonth, monthlyYear],
  );

  const yearlyParams = useMemo(
    () => ({
      customerId: yearlyCustomerId ?? undefined,
      year: yearlyYear,
    }),
    [yearlyCustomerId, yearlyYear],
  );

  return {
    activeTab,
    handleTabChange,
    monthEnd: {
      warehouseId: monthlyWarehouseId,
      month: monthlyMonth,
      year: monthlyYear,
      handleWarehouseChange: handleMonthlyWarehouseChange,
      handleMonthChange: handleMonthlyMonthChange,
      handleYearChange: handleMonthlyYearChange,
      clearFilters: clearMonthlyFilters,
      hasActiveFilters: monthlyHasActiveFilters,
      params: monthlyParams,
    },
    yearEnd: {
      customerId: yearlyCustomerId,
      year: yearlyYear,
      handleCustomerChange: handleYearlyCustomerChange,
      handleYearChange: handleYearlyYearChange,
      clearFilters: clearYearlyFilters,
      hasActiveFilters: yearlyHasActiveFilters,
      params: yearlyParams,
    },
  };
}
