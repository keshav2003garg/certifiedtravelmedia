---
name: create_analytics_graph
description: Create logic for generating analytics graphs (date-wise series) using `createCompleteDateSeries` or `createCumulativeDateSeries` in `apps/api/src/utils/analytics.ts`.
---

# Create Analytics Graph

This skill helps you implement analytics graphs, such as user growth or revenue over time, by filling in missing dates for complete time-series data.

## 1. Define Types

In `apps/api/src/routes/<feature>/<feature>.types.ts`, ensure you have a date range params type.

```typescript
export type DateRangeParams = {
  from: Date;
  to: Date;
};
```

## 2. Validator Setup

In `apps/api/src/routes/<feature>/<feature>.validators.ts`, use the consolidated date range validator.

```typescript
import { createValidatorSchema } from '@/utils/zod-validator-schema';
import {
  dateRangeSchema,
  dateRangeRefine,
  createDateRangeTransform,
} from '@/validator/date.validator';

export const getGraphValidator = createValidatorSchema({
  // Default lookback can be adjusted, e.g., 30 days
  query: dateRangeSchema
    .superRefine(dateRangeRefine)
    .transform(createDateRangeTransform(30)),
});

export type GetGraphContext = TypedContext<typeof getGraphValidator>;
```

## 3. Service Implementation

In `apps/api/src/routes/<feature>/<feature>.services.ts`, import the analytics utilities.

```typescript
import db from '@/db';
import { sql, and, gte, lte } from 'drizzle-orm';
import { toDateString } from '@/utils/date';
import { createCompleteDateSeries, createCumulativeDateSeries } from '@/utils/analytics';
import type { DateRangeParams } from './<feature>.types';

// ... inside Service class

async getMyGraph(period: DateRangeParams) {
  const fromDateStr = toDateString(period.from);
  const toDateStr = toDateString(period.to);

  // 1. Fetch sparse data (grouped by date)
  const sparseData = await db
    .select({
      date: sql<string>`DATE(created_at)`.as('date'), // Adjust 'created_at' as needed
      value: sql<number>`count(*)`.mapWith(Number),  // or sum(price), etc.
    })
    .from(someSchema)
    .where(
      and(
        gte(sql`DATE(created_at)`, sql`${fromDateStr}::date`),
        lte(sql`DATE(created_at)`, sql`${toDateStr}::date`)
        // ... other filters
      )
    )
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  // 2. (Optional) For Cumulative Graphs: Fetch initial baseline count before 'from' date
  /*
  const [initialResult] = await db
    .select({ value: count() })
    .from(someSchema)
    .where(lt(sql`DATE(created_at)`, sql`${fromDateStr}::date`));
  const initialCount = { value: Number(initialResult?.value ?? 0) };
  */

  // 3. Generate Complete Series
  // OPTION A: Simple Daily Series (Non-cumulative)
  return createCompleteDateSeries(sparseData, period, { value: 0 });

  // OPTION B: Cumulative Series (e.g., Total Users over time)
  // return createCumulativeDateSeries(initialCount, sparseData, period);
}
```

## 4. Handler Implementation

In `apps/api/src/routes/<feature>/<feature>.handlers.ts`:

```typescript
import sendResponse from '@/utils/response';
import { featureService } from './<feature>.services';
import type { GetGraphContext } from './<feature>.validators';

export async function getGraphHandler(ctx: GetGraphContext) {
  const { from, to } = ctx.req.valid('query');
  const graphData = await featureService.getMyGraph({ from, to });

  return sendResponse(ctx, 200, 'Graph data retrieved', { graphData });
}
```
