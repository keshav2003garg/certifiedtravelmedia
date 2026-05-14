import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { ChevronLeft, ChevronRight } from '@repo/ui/lib/icons';

const MONTH_NAMES = [
  '',
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

interface MonthPickerProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

export const MonthPicker = memo(function MonthPicker({
  month,
  year,
  onMonthChange,
}: MonthPickerProps) {
  function handlePrev() {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  }

  function handleNext() {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  }

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white/80 px-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-foreground min-w-24 text-center text-xs font-semibold">
        {MONTH_NAMES[month]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={handleNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});
