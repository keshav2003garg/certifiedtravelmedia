import { memo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { CheckCircle } from '@repo/ui/lib/icons';
import { formatDecimal } from '@repo/utils/number';

interface ScanSuccessCardProps {
  endCount: number;
  month: number;
  year: number;
  itemName: string;
}

const MONTH_LABELS = [
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
] as const;

export const ScanSuccessCard = memo(function ScanSuccessCard({
  endCount,
  month,
  year,
  itemName,
}: ScanSuccessCardProps) {
  const formattedEndCount = formatDecimal(endCount, {
    maxDecimals: 2,
    minDecimals: 0,
  });
  const periodLabel = `${MONTH_LABELS[month - 1] ?? 'Selected month'} ${year}`;

  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="items-center text-center">
          <CheckCircle className="size-12 text-emerald-600" />
          <CardTitle className="text-xl tracking-normal">Count saved</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-sm">
            Month-end count of{' '}
            <span className="text-foreground font-semibold">
              {formattedEndCount}
            </span>{' '}
            has been recorded for{' '}
            <span className="text-foreground font-semibold">{itemName}</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
