import type { Chart } from '@/hooks/useChart/types';

interface ChartHeaderProps {
  chart: Chart;
}

export function ChartHeader({ chart }: ChartHeaderProps) {
  const paidCount = chart.tiles.filter((t) => t.tileType === 'Paid').length;
  const fillerCount = chart.tiles.filter((t) => t.tileType === 'Filler').length;
  const removalCount = chart.removals.length;

  return (
    <div className="mb-4 text-center sm:mb-6 md:mb-8 md:text-left">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
        {chart.location.name}
      </h1>
      <p className="mt-1 text-xs text-gray-600 sm:text-sm md:mt-2 md:text-base">
        {chart.location.address}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-xs sm:mt-3 sm:gap-2 sm:text-sm md:mt-4 md:justify-start md:gap-3">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 sm:px-3 sm:py-1">
          Grid: {chart.location.pockets.width}×{chart.location.pockets.height}
        </span>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 sm:px-3 sm:py-1">
          {paidCount} active
        </span>
        {fillerCount > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800 sm:px-3 sm:py-1">
            {fillerCount} fillers
          </span>
        )}
        {removalCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 sm:px-3 sm:py-1">
            {removalCount} to remove
          </span>
        )}
      </div>
    </div>
  );
}
