---
name: create_feature_ui
description: Create a complete frontend feature including folder structure, routes, hooks, and components for admin or user apps.
---

# Create Feature UI (Frontend)

This skill is the **master orchestration guide** for creating a full frontend feature. It covers folder structure and route setup. For specific component patterns, see the dedicated skills:

- **List Page** → `create_list_page` skill
- **Detail Page** → `create_detail_page` skill
- **Form Page** → `create_form_page` skill
- **Filter Hook** → `create_filter_hook` skill
- **API Hook** → `create_api_hook` skill
- **Translations** → `create_translation` skill

## 1. Folder Structure

Create the following structure in `apps/<app>/src/components/<feature>/`:

```
components/<feature>/
├── <feature>-list/              # List View
│   ├── <feature>-page.tsx       # Main orchestrator (hooks + data + layout)
│   ├── <feature>-table.tsx      # Table with headers (or <feature>-grid.tsx)
│   ├── <feature>-table-row.tsx  # Individual row (memoized)
│   ├── filter-bar.tsx           # Search + filter controls + active filter badges
│   ├── stats-cards.tsx          # Summary stats cards (optional)
│   ├── <feature>-skeleton.tsx   # Loading skeleton
│   └── <feature>-empty.tsx      # Empty state
├── <feature>-detail/            # Detail View
│   ├── <feature>-detail-page.tsx  # Main detail container
│   ├── <feature>-tabs.tsx       # Tab navigation
│   ├── <feature>-info-cards.tsx # Key metric cards
│   ├── overview-tab.tsx         # Tab content: overview
│   ├── pricing-tab.tsx          # Tab content: pricing (if applicable)
│   └── inventory-tab.tsx        # Tab content: inventory (if applicable)
├── <feature>-form/              # Create/Edit Form
│   ├── <feature>-form.tsx       # Form container (create/edit mode)
│   ├── schema.ts                # Zod schema + helpers
│   ├── basic-info-section.tsx   # Form section
│   ├── pricing-section.tsx      # Form section
│   ├── images-section.tsx       # Upload section
│   ├── settings-section.tsx     # Form section
│   └── category-picker.tsx      # Specialized picker
└── common/                      # Shared within feature
    ├── delete-<feature>-dialog.tsx  # Confirmation dialog
    ├── pagination-controls.tsx  # Pagination UI
    ├── status-badge.tsx         # Visual status indicator
    ├── price-display.tsx        # Formatted price
    └── stock-indicator.tsx      # Color-coded stock level
```

## 2. Hooks Structure

```
hooks/use<Feature>/
├── index.ts                     # API hook (query options + mutations)
├── types.ts                     # Request/Response type definitions
└── use<Feature>Filters.ts       # URL filter state (nuqs)
```

## 3. Route Definitions

Routes in `apps/<app>/src/routes/dashboard/(routes)/`:

**List Route (`<feature>.index.tsx`):**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { getMetadata } from '@/utils/metadata.util';
import FeaturePage from '@/components/<feature>/<feature>-list/<feature>-page';

export const Route = createFileRoute('/dashboard/(routes)/<feature>/')({
  component: FeaturePage,
  head: () => getMetadata('/dashboard/<feature>'),
});
```

**Detail Route (`<feature>.$id.tsx`):**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { getMetadata } from '@/utils/metadata.util';
import FeatureDetailPage from '@/components/<feature>/<feature>-detail/<feature>-detail-page';

export const Route = createFileRoute('/dashboard/(routes)/<feature>/$id')({
  component: FeatureDetailRoute,
  head: () => getMetadata('/dashboard/<feature>/$id'),
});

// Extract params and pass as props (keeps detail page testable)
function FeatureDetailRoute() {
  const { id } = Route.useParams();
  return <FeatureDetailPage id={id} />;
}
```

**Create Route (`<feature>.new.tsx`):**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { getMetadata } from '@/utils/metadata.util';
import FeatureForm from '@/components/<feature>/<feature>-form/<feature>-form';

export const Route = createFileRoute('/dashboard/(routes)/<feature>/new')({
  component: () => <FeatureForm mode="create" />,
  head: () => getMetadata('/dashboard/<feature>/new'),
});
```

**Route Naming Rules:**

- `(routes)` — path group (organizational only, doesn't affect URL)
- `.index.tsx` — list page at `/dashboard/<feature>/`
- `.$id.tsx` — detail page at `/dashboard/<feature>/:id`
- `.new.tsx` — create page at `/dashboard/<feature>/new`

## 4. Translation Namespace

Create `apps/<app>/src/locales/en/<feature>.json` and `apps/<app>/src/locales/nb/<feature>.json`.
Register in `apps/<app>/src/lib/i18n.ts` namespace array.

See `create_translation` skill for full structure.

## 5. React Query Keys

Add to `apps/<app>/src/types/react-query-keys.ts`:

```typescript
export enum ReactQueryKeys {
  // ... existing keys
  GET_FEATURES = 'GET::/<feature>',
  GET_FEATURE = 'GET::/<feature>/:id',
  GET_FEATURE_STATS = 'GET::/<feature>/stats',
}
```

## 6. Navigation Links

Use TanStack Router's type-safe links:

```typescript
// From list → create
<Button asChild size="sm">
  <Link to="/dashboard/<feature>/new">
    <Plus className="size-4" />
    {t('page.newFeature')}
  </Link>
</Button>

// From list → detail
<Link
  to="/dashboard/<feature>/$id"
  params={{ id: item.id }}
  className="hover:text-primary transition-colors"
>
  {item.name}
</Link>

// Programmatic navigation (after mutation success)
const router = useRouter();
router.navigate({
  to: '/dashboard/<feature>/$id',
  params: { id: result.item.id },
});
```

## 7. UI Import Conventions

```typescript
// Components from shared UI package
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import { Badge } from '@repo/ui/components/base/badge';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Switch } from '@repo/ui/components/base/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/base/tabs';
import { Separator } from '@repo/ui/components/base/separator';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';

// Icons
import {
  Package,
  Plus,
  Trash2,
  Download,
  Search,
  Filter,
  X,
  Eye,
  Pencil,
} from '@repo/ui/lib/icons';

// Utilities
import { cn } from '@repo/ui/lib/utils';

// Form hooks
import { useForm, zodResolver } from '@repo/ui/lib/form';

// Shared utilities
import { formatNOK, calcPriceWithVat } from '@repo/utils/price';
import { formatShortDate } from '@repo/utils/date';

// Translations
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
```

## Common Mistakes to Avoid

1. **NEVER put data fetching in route loaders** — use `useQuery` in page components instead
2. **NEVER skip the `memo()` wrapper** on table row components — prevents expensive re-renders
3. **NEVER hardcode strings** — always use `t()` from `useTranslation('<feature>')`
4. **NEVER import icons from `lucide-react`** — use `@repo/ui/lib/icons`
5. **NEVER import `cn` from any other path** — use `@repo/ui/lib/utils`
6. **ALWAYS use `getMetadata()` in route `head`** for consistent page titles
7. **ALWAYS extract route params in a wrapper function** — keeps page components testable
8. **ALWAYS create a skeleton component** — never show blank pages during loading
9. **ALWAYS create an empty state** — never show empty tables without explanation
10. **ALWAYS pass `id` as prop from route** — don't call `useParams` inside detail/form components
