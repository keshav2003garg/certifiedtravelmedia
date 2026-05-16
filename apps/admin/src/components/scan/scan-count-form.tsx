import { memo, useCallback, useMemo, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Label } from '@repo/ui/components/base/label';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { CalendarDays, Loader2 } from '@repo/ui/lib/icons';
import { formatDecimal } from '@repo/utils/number';

import type { FormEvent } from 'react';
import type {
  ScanInventoryItem,
  SubmitScanCountPayload,
} from '@/hooks/useScan/types';

interface ScanCountFormProps {
  item: ScanInventoryItem;
  onSubmit: (payload: SubmitScanCountPayload) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export const ScanCountForm = memo(function ScanCountForm({
  item,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}: ScanCountFormProps) {
  const [endCount, setEndCount] = useState<number | null>(null);
  const allowedPeriods = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previous =
      currentMonth === 1
        ? { month: 12, year: currentYear - 1 }
        : { month: currentMonth - 1, year: currentYear };
    const current = { month: currentMonth, year: currentYear };

    return [previous, current] as const;
  }, []);
  const [periodKey, setPeriodKey] = useState(() => {
    const period = allowedPeriods[0];
    return `${period.year}-${String(period.month).padStart(2, '0')}`;
  });
  const selectedPeriod = useMemo(() => {
    const match = allowedPeriods.find(
      (period) =>
        `${period.year}-${String(period.month).padStart(2, '0')}` === periodKey,
    );
    return match ?? allowedPeriods[0];
  }, [allowedPeriods, periodKey]);
  const month = selectedPeriod.month;
  const year = selectedPeriod.year;

  const canSubmit = endCount !== null && !isSubmitting;

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit || endCount === null) return;

      onSubmit({ endCount, month, year });
    },
    [canSubmit, endCount, month, onSubmit, year],
  );

  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader>
          <div className="text-muted-foreground mb-1 flex size-10 items-center justify-center rounded-md border">
            <CalendarDays className="size-5" />
          </div>
          <CardTitle className="text-xl tracking-normal">
            Month-end count
          </CardTitle>
          <CardDescription>
            {item.brochureName || item.brochureTypeName}
            {item.customerName ? ` - ${item.customerName}` : ''}
          </CardDescription>
          <p className="text-muted-foreground text-xs">
            Current inventory: {formatDecimal(item.boxes)} boxes -{' '}
            {formatDecimal(item.unitsPerBox)} units/box
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="scan-period">Period</Label>
              <Select
                value={periodKey}
                onValueChange={setPeriodKey}
                disabled={isSubmitting}
              >
                <SelectTrigger id="scan-period" className="h-11">
                  <CalendarDays className="text-muted-foreground size-4" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {allowedPeriods.map((period) => {
                    const key = `${period.year}-${String(period.month).padStart(2, '0')}`;
                    const label =
                      MONTH_OPTIONS.find(
                        (option) => option.value === period.month,
                      )?.label ?? '';

                    return (
                      <SelectItem key={key} value={key}>
                        {label} {period.year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-count">End count</Label>
              <NumericInput
                id="end-count"
                value={endCount}
                onChange={(value) => setEndCount(value ?? null)}
                min={0}
                step={0.01}
                decimals={2}
                disabled={isSubmitting}
                placeholder="Enter count"
                className="h-11"
              />
            </div>

            {submitError ? (
              <p className="text-destructive text-sm">{submitError}</p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Save count
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
