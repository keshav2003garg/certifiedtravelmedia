import { useSuspenseQuery } from '@tanstack/react-query';

import { useChart } from '@/hooks/useChart';
import { useChartFilters } from '@/hooks/useChart/useChartFilters';

import ChartGrid from './chart-grid';
import { ChartHeader } from './chart-header';
import { ChartNotes } from './chart-notes';
import { ChartToolbar } from './chart-toolbar';

interface ChartPageProps {
  locationId: string;
}

export function ChartPage({ locationId }: ChartPageProps) {
  const { chartQueryOptions } = useChart();
  const { month, year, setMonth, setYear } = useChartFilters();

  const { data: chart } = useSuspenseQuery(
    chartQueryOptions({ locationId, month, year }),
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-3 py-4 sm:p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <ChartHeader chart={chart} />

        <ChartToolbar
          locationId={locationId}
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />

        <ChartGrid
          width={chart.location.pockets.width}
          height={chart.location.pockets.height}
          tiles={chart.tiles}
          removals={chart.removals}
          persisted={chart.persisted}
        />

        <ChartNotes generalNotes={chart.generalNotes} />
      </div>
    </div>
  );
}
