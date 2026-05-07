import { memo, useEffect, useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';

import type { ChartRemoval, ChartTile } from '@/hooks/useChart/types';

interface ChartGridProps {
  width: number;
  height: number;
  tiles: ChartTile[];
  removals?: ChartRemoval[];
  persisted?: boolean;
}

const TIER_COLORS = {
  'Premium Placement': {
    bg: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-600',
  },
  'Normal Placement': {
    bg: 'bg-blue-500',
    text: 'text-white',
    border: 'border-blue-600',
  },
} as const;

const NEW_COLORS = {
  bg: 'bg-emerald-500',
  text: 'text-white',
  border: 'border-emerald-600',
} as const;

const FILLER_COLORS = {
  bg: 'bg-gray-300',
  text: 'text-gray-700',
  border: 'border-gray-400',
} as const;

const REMOVAL_COLORS = {
  bg: 'bg-red-500',
  text: 'text-white',
  border: 'border-red-600',
} as const;

const FLAGGED_RING = 'ring-2 ring-orange-400 ring-offset-1';

const MIN_CELL_SIZE = 40;
const MAX_CELL_SIZE = 80;

function ChartGrid(props: ChartGridProps) {
  const { width, height, tiles, removals = [], persisted = false } = props;

  const [cellSize, setCellSize] = useState(60);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasContent = tiles.length > 0 || removals.length > 0;
  const hasFillers = tiles.some((t) => t.tileType === 'Filler');
  const hasFlagged = tiles.some((t) => t.isFlagged);
  const hasNew = tiles.some((t) => t.tileType !== 'Filler' && t.isNew);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches,
      );
    };
    checkTouchDevice();
  }, []);

  useEffect(() => {
    const updateCellSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const availableWidth = containerWidth - 64;
        const calculatedCellSize = Math.floor(availableWidth / width);
        const clampedSize = Math.max(
          MIN_CELL_SIZE,
          Math.min(MAX_CELL_SIZE, calculatedCellSize),
        );
        setCellSize(clampedSize);
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [width]);

  const isMobile = cellSize <= 50;

  return (
    <TooltipProvider delayDuration={100}>
      <div
        ref={containerRef}
        className="w-full overflow-x-auto rounded-xl bg-white p-4 shadow-lg sm:rounded-2xl sm:p-6 md:p-8"
      >
        <div
          className="relative mx-auto rounded-lg border-2 border-slate-300 bg-slate-100"
          style={{
            width: width * cellSize + 2,
            height: height * cellSize + 2,
          }}
        >
          <GridContent
            width={width}
            height={height}
            cellSize={cellSize}
            tiles={tiles}
            removals={removals}
            persisted={persisted}
            hasContent={hasContent}
            isMobile={isMobile}
            isTouchDevice={isTouchDevice}
            openTooltip={openTooltip}
            setOpenTooltip={setOpenTooltip}
          />
        </div>

        {hasContent && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-4 sm:mt-6 sm:gap-4 md:gap-6">
            {hasNew && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-6 rounded bg-emerald-500 md:h-5 md:w-8" />
                <span className="text-xs text-gray-600 sm:text-sm">
                  New Client
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-amber-500 md:h-5 md:w-8" />
              <span className="text-xs text-gray-600 sm:text-sm">
                Premium Placement
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 rounded bg-blue-500 md:h-5 md:w-8" />
              <span className="text-xs text-gray-600 sm:text-sm">
                Normal Placement
              </span>
            </div>
            {removals.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-6 rounded bg-red-500 md:h-5 md:w-8" />
                <span className="text-xs text-gray-600 sm:text-sm">
                  To Remove
                </span>
              </div>
            )}
            {hasFillers && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-6 rounded bg-gray-300 md:h-5 md:w-8" />
                <span className="text-xs text-gray-600 sm:text-sm">Filler</span>
              </div>
            )}
            {hasFlagged && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-6 rounded bg-white ring-2 ring-orange-400 md:h-5 md:w-8" />
                <span className="text-xs text-gray-600 sm:text-sm">
                  Flagged
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface GridContentProps {
  width: number;
  height: number;
  cellSize: number;
  tiles: ChartTile[];
  removals: ChartRemoval[];
  persisted: boolean;
  hasContent: boolean;
  isMobile: boolean;
  isTouchDevice: boolean;
  openTooltip: string | null;
  setOpenTooltip: (id: string | null) => void;
}

function GridContent({
  width,
  height,
  cellSize,
  tiles,
  removals,
  persisted,
  hasContent,
  isMobile,
  isTouchDevice,
  openTooltip,
  setOpenTooltip,
}: GridContentProps) {
  const textSizeType = isMobile
    ? 'text-[9px] leading-[10px]'
    : 'text-[11px] leading-[13px]';

  return (
    <>
      {/* Grid lines */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: width * height }).map((_, i) => (
          <div key={i} className="border border-slate-200" />
        ))}
      </div>

      {/* Tiles (Paid + Filler) */}
      {tiles.map((tile) => {
        const isFiller = tile.tileType === 'Filler';
        const isNew = !isFiller && tile.isNew;
        const colors = isFiller
          ? FILLER_COLORS
          : isNew
            ? NEW_COLORS
            : tile.tier
              ? TIER_COLORS[tile.tier]
              : TIER_COLORS['Normal Placement'];

        const tooltipId = `tile-${tile.id}`;
        const isOpen = openTooltip === tooltipId;

        return (
          <Tooltip
            key={tooltipId}
            open={isTouchDevice ? isOpen : undefined}
            onOpenChange={
              isTouchDevice
                ? (open) => setOpenTooltip(open ? tooltipId : null)
                : undefined
            }
          >
            <TooltipTrigger asChild>
              <div
                className={`absolute ${colors.bg} ${colors.text} ${colors.border} ${tile.isFlagged ? FLAGGED_RING : ''} flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 p-0.5 text-center shadow-md transition-transform hover:z-10 hover:scale-105 active:scale-95 md:rounded-lg md:p-1`}
                style={{
                  left: tile.col * cellSize + 1,
                  top: tile.row * cellSize + 1,
                  width: tile.colSpan * cellSize - 2,
                  height: cellSize - 2,
                }}
                onClick={
                  isTouchDevice
                    ? () => setOpenTooltip(isOpen ? null : tooltipId)
                    : undefined
                }
              >
                {tile.coverPhotoUrl ? (
                  <div className="absolute inset-0">
                    <img
                      src={tile.coverPhotoUrl}
                      alt={tile.label || ''}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 px-0.5 py-0.5">
                      <span
                        className={`${textSizeType} line-clamp-1 w-full font-semibold text-white`}
                      >
                        {tile.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span
                    className={`${textSizeType} line-clamp-3 w-full overflow-hidden px-0.5 font-semibold`}
                  >
                    {tile.label || (isFiller ? 'Filler' : '')}
                  </span>
                )}
                {tile.isFlagged && (
                  <span className="absolute top-0 right-0 text-[8px]">🚩</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-50 text-center">
              <div className="space-y-1">
                <p className="font-semibold">
                  {tile.label || (isFiller ? 'Filler' : 'Tile')}
                </p>
                {tile.brochureTypeName && (
                  <p className="text-xs opacity-80">
                    Type: {tile.brochureTypeName}
                  </p>
                )}
                {tile.customerName && (
                  <p className="text-xs opacity-80">
                    Customer: {tile.customerName}
                  </p>
                )}
                {tile.contractId && (
                  <p className="text-xs opacity-80">
                    Contract: {tile.contractId}
                  </p>
                )}
                {tile.contractEndDate && (
                  <p className="text-xs opacity-80">
                    Ends: {tile.contractEndDate}
                  </p>
                )}
                {tile.isFlagged && tile.flagNote && (
                  <p className="text-xs font-medium text-orange-600">
                    🚩 {tile.flagNote}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {/* Removals - only shown when not persisted */}
      {!persisted &&
        removals.map((removal, index) => {
          const tooltipId = `removal-${index}`;
          const isOpen = openTooltip === tooltipId;

          return (
            <Tooltip
              key={tooltipId}
              open={isTouchDevice ? isOpen : undefined}
              onOpenChange={
                isTouchDevice
                  ? (open) => setOpenTooltip(open ? tooltipId : null)
                  : undefined
              }
            >
              <TooltipTrigger asChild>
                <div
                  className={`absolute ${REMOVAL_COLORS.bg} ${REMOVAL_COLORS.text} ${REMOVAL_COLORS.border} flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed p-0.5 text-center shadow-md transition-transform hover:z-10 hover:scale-105 active:scale-95 md:rounded-lg md:p-1`}
                  style={{
                    left: removal.position.col * cellSize + 1,
                    top: removal.position.row * cellSize + 1,
                    width: removal.size.cols * cellSize - 2,
                    height: removal.size.rows * cellSize - 2,
                  }}
                  onClick={
                    isTouchDevice
                      ? () => setOpenTooltip(isOpen ? null : tooltipId)
                      : undefined
                  }
                >
                  <span
                    className={`${textSizeType} line-clamp-2 w-full overflow-hidden px-0.5 font-semibold`}
                  >
                    {removal.brochureName}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-50 border-red-200 bg-red-50 text-center text-red-900"
              >
                <div className="space-y-1">
                  <p className="font-semibold">⚠️ {removal.brochureName}</p>
                  <p className="text-xs opacity-80">
                    Contract: {removal.contractId}
                  </p>
                  <p className="text-xs opacity-80">
                    Expired: {removal.expiredDate}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

      {/* Empty state */}
      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <span className="text-sm">No placements for this month</span>
        </div>
      )}
    </>
  );
}

export default memo(ChartGrid);
