import { memo, useCallback, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Calendar } from '@repo/ui/components/base/calendar';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import { CalendarIcon } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatFullDate, parseISODate, toISODate } from '@repo/utils/date';

interface DateReceivedFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  label?: string;
}

function DateReceivedField({
  value,
  onChange,
  disabled,
  label = 'Date received',
}: DateReceivedFieldProps) {
  const selectedDate = useMemo(() => parseISODate(value), [value]);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange(date ? toISODate(date) : '');
    },
    [onChange],
  );

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-between font-normal',
                !selectedDate && 'text-muted-foreground',
              )}
            >
              {selectedDate ? formatFullDate(selectedDate) : 'Pick a date'}
              <CalendarIcon className="size-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Calendar
            className="w-full"
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}

export default memo(DateReceivedField);
