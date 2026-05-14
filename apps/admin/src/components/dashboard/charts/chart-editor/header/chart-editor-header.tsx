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
  removals: number;
}

interface ChartEditorHeaderProps {
  chart: ChartLayout;
  stats: ChartEditorStats;
  isFullscreen: boolean;
  isPreview: boolean;
  isPastMonth: boolean;
  unplacedPaidCount: number;
  isManager: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCloning: boolean;
  isInitializing: boolean;
  isPrinting: boolean;
  onSave: () => void;
  onComplete: () => void;
  onClone: () => void;
  onInitialize: () => void;
  onPrint: () => void;
  onMonthChange: (month: number, year: number) => void;
}

export const ChartEditorHeader = memo(function ChartEditorHeader({
  chart,
  stats,
  isFullscreen,
  isPreview,
  isPastMonth,
  unplacedPaidCount,
  isManager,
  isSaving,
  isCompleting,
  isCloning,
  isInitializing,
  isPrinting,
  onSave,
  onComplete,
  onClone,
  onInitialize,
  onPrint,
  onMonthChange,
}: ChartEditorHeaderProps) {
  return (
    <div className={cn('shrink-0', isFullscreen ? 'space-y-1.5' : 'space-y-2')}>
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
          'flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between',
          isFullscreen ? 'lg:gap-2' : 'lg:gap-3',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <LayoutGrid className="size-4 shrink-0 text-blue-600" />
          <h1
            className={cn(
              'text-foreground min-w-0 truncate font-semibold tracking-normal',
              isFullscreen ? 'text-sm' : 'text-base',
            )}
          >
            {chart.displayName}
          </h1>
          {chart.locked ? (
            <Lock className="text-muted-foreground size-4" />
          ) : null}
          <ChartStatusBadge chart={chart} isPreview={isPreview} />
          <span className="text-muted-foreground hidden min-w-0 truncate text-xs xl:inline">
            {chart.sectorDescription ?? 'Sector'} | Stand {chart.standWidth} x{' '}
            {chart.standHeight} | {chart.locationCount} locations
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 whitespace-nowrap lg:shrink-0 lg:justify-end">
          <HeaderStats chart={chart} stats={stats} />

          <MonthPicker
            month={chart.month}
            year={chart.year}
            onMonthChange={onMonthChange}
          />

          <ChartActions
            isPersisted={chart.persisted}
            isLocked={chart.locked}
            isDraft={chart.status === 'Draft'}
            isPastMonth={isPastMonth}
            unplacedPaidCount={unplacedPaidCount}
            isSaving={isSaving}
            isCompleting={isCompleting}
            isCloning={isCloning}
            isPrinting={isPrinting}
            isManager={isManager}
            onSave={onSave}
            onComplete={onComplete}
            onClone={onClone}
            onPrint={onPrint}
          />
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

interface ChartStatusBadgeProps {
  chart: ChartLayout;
  isPreview: boolean;
}

function ChartStatusBadge({ chart, isPreview }: ChartStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 shrink-0 px-2 text-xs',
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
  );
}

interface HeaderStatsProps {
  chart: ChartLayout;
  stats: ChartEditorStats;
}

function HeaderStats({ chart, stats }: HeaderStatsProps) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white/80 px-2 text-xs shadow-sm">
      <span className="text-muted-foreground inline-flex items-center gap-1 font-medium">
        <Grid3x3 className="size-3.5" />
        {chart.gridSize.width}x{chart.gridSize.height}
      </span>
      <StatsDivider />
      <span className="font-semibold text-blue-600">Paid {stats.paid}</span>
      <span className="font-semibold text-emerald-600">
        Inv {stats.inventory}
      </span>
      <span className="text-muted-foreground font-medium">
        Empty {stats.empty}
      </span>
      {stats.removals > 0 ? (
        <span className="font-semibold text-red-600">
          Remove {stats.removals}
        </span>
      ) : null}
    </div>
  );
}

function StatsDivider() {
  return <span className="h-4 w-px bg-slate-200" aria-hidden="true" />;
}
