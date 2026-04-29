import { eachDayOfInterval, format, formatOrdinalDate } from '@repo/utils/date';

export function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100.0 : 0.0;
  }

  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(2));
}

export function createCompleteDateSeries<T extends { date: string }>(
  sparseData: T[],
  period: { from: Date; to: Date },
  defaultValues?: Omit<T, 'date'>,
): T[] {
  let finalDefaultValues = defaultValues;

  if (!finalDefaultValues && sparseData.length > 0) {
    finalDefaultValues = Object.fromEntries(
      Object.entries(sparseData[0]!)
        .filter(([key]) => key !== 'date')
        .map(([key]) => [key, 0]),
    ) as Omit<T, 'date'>;
  }

  const dataMap = new Map<string, T>(
    sparseData.map((item) => [item.date, item]),
  );

  const dateRange = eachDayOfInterval({
    start: period.from,
    end: period.to,
  });

  const completeSeries = dateRange.map((day) => {
    const formattedDate = formatOrdinalDate(day);
    const existingData = dataMap.get(format(day, 'yyyy-MM-dd'));

    if (existingData) {
      return {
        ...existingData,
        date: formattedDate,
      } as T;
    }

    return {
      date: formattedDate,
      ...finalDefaultValues,
    } as T;
  });

  return completeSeries;
}

export function createCumulativeDateSeries<T extends Record<string, number>>(
  initialCounts: T,
  dailyNewCounts: (T & { date: string })[],
  period: { from: Date; to: Date },
) {
  const completeDailyNewCounts = createCompleteDateSeries(
    dailyNewCounts,
    period,
  );

  const runningTotals: T = { ...initialCounts };

  const cumulativeSeries = completeDailyNewCounts.map((day) => {
    (Object.keys(runningTotals) as Array<keyof T>).forEach((key) => {
      const newCountForDay = day[key as keyof typeof day];

      const currentTotal = Number(runningTotals[key] ?? 0);
      const newAdditions = Number(newCountForDay ?? 0);

      runningTotals[key] = (currentTotal + newAdditions) as T[keyof T];
    });

    return {
      date: day.date,
      ...runningTotals,
    };
  });

  return cumulativeSeries;
}
