import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { Grid3x3, LayoutGrid, Lock, Monitor, Plus } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { ChartActions } from './components/chart-actions';
import { MonthPicker } from './components/month-picker';

import type { ChartLayout } from '@/hooks/useChartEditor/types';

interface ChartEditorStats {
  paid: number;
  inventory: number;
  empty: number;
}

interface ChartEditorHeaderProps {
  chart: ChartLayout;
  stats: ChartEditorStats;
  isFullscreen: boolean;
  isPreview: boolean;
  isPastMonth: boolean;
  isManager: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCloning: boolean;
  isInitializing: boolean;
  onSave: () => void;
  onComplete: () => void;
  onClone: () => void;
  onInitialize: () => void;
  onMonthChange: (month: number, year: number) => void;
}

export const ChartEditorHeader = memo(function ChartEditorHeader({
  chart,
  stats,
  isFullscreen,
  isPreview,
  isPastMonth,
  isManager,
  isSaving,
  isCompleting,
  isCloning,
  isInitializing,
  onSave,
  onComplete,
  onClone,
  onInitialize,
  onMonthChange,
}: ChartEditorHeaderProps) {
  return (
    <div className={cn('shrink-0', isFullscreen ? 'space-y-2' : 'space-y-3')}>
      <Card className="border-blue-200 bg-blue-50 md:hidden">
        <CardContent className="flex items-center gap-3 p-3">
          <Monitor className="size-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            The chart editor works best on a tablet or desktop.
          </p>
        </CardContent>
      </Card>

      <div
        className={cn(
          'lg:flex-row lg:items-center lg:justify-between',
          isFullscreen ? 'flex flex-col gap-2' : 'flex flex-col gap-3',
        )}
      >
        <div
          className={cn('min-w-0', isFullscreen ? 'space-y-0.5' : 'space-y-1')}
        >
          <div className="flex flex-wrap items-center gap-2">
            <LayoutGrid className="size-4 shrink-0 text-blue-600" />
            <h1
              className={cn(
                'text-foreground font-semibold tracking-normal',
                isFullscreen ? 'text-base' : 'text-lg',
              )}
            >
              {chart.displayName}
            </h1>
            {chart.locked ? (
              <Lock className="text-muted-foreground size-4" />
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                isPreview
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : chart.status === 'Draft'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : chart.status === 'Completed'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500',
              )}
            >
              {isPreview
                ? 'Not initialized'
                : chart.status === 'Draft'
                  ? 'Initialized'
                  : chart.status === 'Completed'
                    ? 'Locked'
                    : 'Archived'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {chart.sectorDescription ?? 'Sector'} | Stand {chart.standWidth} x{' '}
            {chart.standHeight} | {chart.locationCount} locations
          </p>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center',
            isFullscreen ? 'gap-2' : 'gap-3',
          )}
        >
          <div
            className={cn(
              'flex flex-wrap items-center text-sm',
              isFullscreen ? 'gap-2' : 'gap-3',
            )}
          >
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Grid3x3 className="size-4" />
              {chart.gridSize.width} x {chart.gridSize.height}
            </span>
            <span className="font-medium text-blue-600">
              Paid: {stats.paid}
            </span>
            <span className="font-medium text-emerald-600">
              Inventory: {stats.inventory}
            </span>
            <span className="text-muted-foreground">Empty: {stats.empty}</span>
          </div>

          <MonthPicker
            month={chart.month}
            year={chart.year}
            onMonthChange={onMonthChange}
          />

          {chart.persisted ? (
            <ChartActions
              isLocked={chart.locked}
              isDraft={chart.status === 'Draft'}
              isPastMonth={isPastMonth}
              isSaving={isSaving}
              isCompleting={isCompleting}
              isCloning={isCloning}
              isManager={isManager}
              onSave={onSave}
              onComplete={onComplete}
              onClone={onClone}
            />
          ) : null}
        </div>
      </div>

      {isPastMonth ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Past month charts are view-only.
        </div>
      ) : null}

      {isPreview ? (
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Preview generated from active contracts for this stand size.
          </span>
          {isManager ? (
            <Button
              type="button"
              size="sm"
              onClick={onInitialize}
              disabled={isInitializing || isPastMonth}
            >
              <Plus className="size-4" />
              {isInitializing ? 'Initializing...' : 'Initialize chart'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
