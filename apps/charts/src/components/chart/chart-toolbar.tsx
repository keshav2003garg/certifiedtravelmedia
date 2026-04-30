import { useCallback } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Printer } from '@repo/ui/lib/icons';

import { useChart } from '@/hooks/useChart';

import { MonthPicker } from './month-picker';

const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface ChartToolbarProps {
  locationId: string;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function ChartToolbar({
  locationId,
  month,
  year,
  onMonthChange,
  onYearChange,
}: ChartToolbarProps) {
  const { getChartPDFUrl } = useChart();

  const handlePrint = useCallback(() => {
    const url = getChartPDFUrl({ locationId, month, year });
    window.open(url, '_blank');
  }, [getChartPDFUrl, locationId, month, year]);

  return (
    <div className="mb-4 flex flex-col items-center gap-2 sm:mb-6 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div className="print-hidden flex items-center gap-2">
        <MonthPicker
          month={month}
          year={year}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={handlePrint}
          aria-label="Open printable PDF"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-700 sm:text-base md:mt-0 md:text-lg">
        Fill Chart: {MONTH_NAMES_FULL[month - 1]} {year}
      </p>
    </div>
  );
}
