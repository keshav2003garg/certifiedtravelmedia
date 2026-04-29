import { type FormEvent, memo, useCallback, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import { Label } from '@repo/ui/components/base/label';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Download, Loader2 } from '@repo/ui/lib/icons';

import type {
  DownloadFullTruckLoadRequest,
  Warehouse,
} from '@/hooks/useWarehouses/types';

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

interface FullTruckLoadDialogProps {
  warehouse: Warehouse | null;
  open: boolean;
  isDownloading: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (payload: DownloadFullTruckLoadRequest['payload']) => void;
}

function FullTruckLoadDialog({
  warehouse,
  open,
  isDownloading,
  onOpenChange,
  onDownload,
}: FullTruckLoadDialogProps) {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState<number | undefined>(() =>
    new Date().getFullYear(),
  );
  const canDownload = Boolean(warehouse && year);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDownloading) return;
      onOpenChange(nextOpen);
    },
    [isDownloading, onOpenChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!warehouse || !year) return;

      onDownload({
        id: warehouse.id,
        warehouseName: warehouse.name,
        month,
        year,
      });
    },
    [month, onDownload, warehouse, year],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download FTL</DialogTitle>
          <DialogDescription>
            {warehouse
              ? `Choose the period for ${warehouse.name}.`
              : 'Choose the period for this warehouse.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ftl-month">Month</Label>
              <Select
                value={String(month)}
                onValueChange={(value) => setMonth(Number(value))}
                disabled={isDownloading}
              >
                <SelectTrigger id="ftl-month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftl-year">Year</Label>
              <NumericInput
                id="ftl-year"
                value={year}
                onChange={setYear}
                min={2000}
                max={2100}
                integerOnly
                disabled={isDownloading}
                placeholder="Year"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDownloading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canDownload || isDownloading}>
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(FullTruckLoadDialog);
