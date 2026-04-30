import { Button } from '@repo/ui/components/base/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { ChevronLeft, ChevronRight } from '@repo/ui/lib/icons';

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
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

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

interface MonthPickerProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function MonthPicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: MonthPickerProps) {
  const goToPreviousMonth = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white p-1.5 shadow-md sm:gap-2 sm:rounded-xl sm:p-2 md:gap-3 md:p-3">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9"
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select
        value={String(month)}
        onValueChange={(val) => onMonthChange(Number(val))}
      >
        <SelectTrigger className="h-8 w-17.5 text-xs sm:h-9 sm:w-30 sm:text-sm md:w-35">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES_FULL.map((name, idx) => (
            <SelectItem key={idx} value={String(idx + 1)}>
              <span className="sm:hidden">{MONTH_NAMES_SHORT[idx]}</span>
              <span className="hidden sm:inline">{name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(year)}
        onValueChange={(val) => onYearChange(Number(val))}
      >
        <SelectTrigger className="h-8 w-20 text-xs sm:h-9 sm:w-22.5 sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
