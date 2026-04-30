import { memo } from 'react';

import { Link } from '@tanstack/react-router';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Edit, LayoutGrid, Lock, MapPin } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import type {
  Pagination,
  SectorStandSize,
  SectorWithStandSizes,
} from '@/hooks/useChartEditor/types';

const CHART_STATUS_LABELS = {
  Draft: 'Initialized',
  Completed: 'Locked',
  Archived: 'Archived',
} as const;

const CHART_STATUS_STYLES = {
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  Completed: 'border-green-200 bg-green-50 text-green-700',
  Archived: 'border-gray-200 bg-gray-50 text-gray-500',
} as const;

interface SectorChartsViewProps {
  sectors: SectorWithStandSizes[];
  pagination: Pagination | undefined;
  month: number;
  year: number;
  currentLimit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const SectorChartsView = memo(function SectorChartsView({
  sectors,
  pagination,
  month,
  year,
  currentLimit,
  onPageChange,
  onLimitChange,
}: SectorChartsViewProps) {
  return (
    <div className="space-y-4">
      <div className="divide-y rounded-md border">
        {sectors.map((sector) => (
          <SectorRow
            key={sector.id}
            sector={sector}
            month={month}
            year={year}
          />
        ))}
      </div>

      {pagination ? (
        <DataPaginationControls
          pagination={pagination}
          currentLimit={currentLimit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      ) : null}
    </div>
  );
});

interface SectorRowProps {
  sector: SectorWithStandSizes;
  month: number;
  year: number;
}

const SectorRow = memo(function SectorRow({
  sector,
  month,
  year,
}: SectorRowProps) {
  const totalLocations = sector.standSizes.reduce(
    (sum, standSize) => sum + standSize.locationCount,
    0,
  );

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
            <LayoutGrid className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground text-base font-semibold tracking-normal">
                {sector.acumaticaId}
              </h2>
              {sector.matchesSearch ? (
                <Badge variant="secondary">Sector match</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {sector.description}
            </p>
          </div>
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <MapPin className="size-4" />
          {totalLocations} locations
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        {sector.standSizes.map((standSize) => (
          <StandSizeRow
            key={`${sector.id}-${standSize.width}-${standSize.height}`}
            sectorId={sector.id}
            standSize={standSize}
            month={month}
            year={year}
          />
        ))}
      </div>
    </div>
  );
});

interface StandSizeRowProps {
  sectorId: string;
  standSize: SectorStandSize;
  month: number;
  year: number;
}

const StandSizeRow = memo(function StandSizeRow({
  sectorId,
  standSize,
  month,
  year,
}: StandSizeRowProps) {
  const statusLabel = standSize.chartStatus
    ? CHART_STATUS_LABELS[standSize.chartStatus]
    : 'Not initialized';
  const statusStyle = standSize.chartStatus
    ? CHART_STATUS_STYLES[standSize.chartStatus]
    : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className="flex flex-col gap-3 border-b p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-foreground text-sm font-semibold">
          {standSize.width} x {standSize.height}
        </span>
        <span className="text-muted-foreground text-sm">
          {standSize.locationCount} locations
        </span>
        {standSize.matchedLocationCount > 0 ? (
          <span className="text-muted-foreground text-xs">
            {standSize.matchedLocationCount} matched
          </span>
        ) : null}
        <Badge variant="outline" className={cn('font-medium', statusStyle)}>
          {statusLabel}
        </Badge>
        {standSize.locked ? (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Lock className="size-3.5" />
            Locked
          </span>
        ) : null}
      </div>

      <Button variant="outline" size="sm" asChild>
        <Link
          to="/charts/$sectorId"
          params={{ sectorId }}
          search={{
            width: standSize.width,
            height: standSize.height,
            month,
            year,
          }}
        >
          <Edit className="size-4" />
          Open
        </Link>
      </Button>
    </div>
  );
});
