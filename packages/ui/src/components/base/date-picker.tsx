'use client';

import * as React from 'react';

import { format, isValid, parse } from 'date-fns';
import { CalendarIcon, XIcon } from 'lucide-react';

import { Button } from '@repo/ui/components/base/button';
import { Calendar } from '@repo/ui/components/base/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import { cn } from '@repo/ui/lib/utils';

/** YYYY-MM-DD string format used by the API / form values */
const DATE_VALUE_FORMAT = 'yyyy-MM-dd';

/** Parses a YYYY-MM-DD string to a Date. Returns undefined for empty/invalid input. */
function parseDateValue(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

/** Converts a Date to a YYYY-MM-DD string */
function formatDateValue(date: Date): string {
  return format(date, DATE_VALUE_FORMAT);
}

interface DatePickerProps {
  /** Current value as YYYY-MM-DD string (or null/undefined for empty) */
  value?: string | null;
  /** Called with YYYY-MM-DD string when a date is selected, or null when cleared */
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Show an × button to clear the selected date */
  clearable?: boolean;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  clearable = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateValue(value);

  function handleSelect(date: Date | undefined) {
    onChange(date ? formatDateValue(date) : null);
    if (date) setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          disabled={disabled}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal',
            className,
          )}
        >
          <CalendarIcon />
          <span className="flex-1 truncate">
            {selected ? format(selected, 'PPP') : placeholder}
          </span>
          {clearable && selected && (
            <XIcon
              className="ml-auto size-3.5 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          className="w-62"
          selected={selected}
          onSelect={handleSelect}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
