---
name: create_detail_page
description: Create a standardized detail page with tabs, info cards, edit mode toggle, danger zone, and delete dialog.
---

# Create Detail Page

This skill creates the complete detail view for admin features: detail page, tabs, info cards, section cards, and danger zone with delete dialog.

**Location:** `apps/<app>/src/components/<feature>/<feature>-detail/`

## 1. Detail Page Container (`<feature>-detail-page.tsx`)

The detail page manages loading/error/edit states and delegates display to child components.

```typescript
// apps/<app>/src/components/<feature>/<feature>-detail/<feature>-detail-page.tsx
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@repo/ui/components/base/button';
import { Separator } from '@repo/ui/components/base/separator';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { ArrowLeft, Pencil, Trash2, AlertTriangle } from '@repo/ui/lib/icons';
import { useFeatures } from '@/hooks/useFeatures';
import FeatureForm from '../<feature>-form/<feature>-form';
import FeatureInfoCards from './<feature>-info-cards';
import FeatureTabs from './<feature>-tabs';
import DeleteFeatureDialog from '../common/delete-<feature>-dialog';

interface FeatureDetailPageProps {
  id: string;
}

export default function FeatureDetailPage({ id }: FeatureDetailPageProps) {
  const { t } = useTranslation('<feature>');
  const router = useRouter();
  const { featureQueryOptions, deleteMutation } = useFeatures();
  const { data, isLoading } = useQuery(featureQueryOptions(id));
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const item = data?.item;

  // ─── Delete handler ────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!item) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.navigate({ to: '/dashboard/<feature>' });
      },
    });
  }, [item, deleteMutation, router]);

  // ─── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ─── Not found state ───────────────────────────────────────────
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">{t('detail.notFound')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('detail.notFoundDescription')}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/dashboard/<feature>">
            <ArrowLeft className="mr-2 size-4" />
            {t('detail.backToList')}
          </Link>
        </Button>
      </div>
    );
  }

  // ─── Edit mode ─────────────────────────────────────────────────
  if (isEditing) {
    return <FeatureForm mode="edit" item={item} onCancel={() => setIsEditing(false)} />;
  }

  // ─── Detail view ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9">
            <Link to="/dashboard/<feature>">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground text-sm">
              {t('detail.createdOn', { date: formatShortDate(item.createdAt) })}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
          <Pencil className="size-3.5" />
          {t('detail.edit')}
        </Button>
      </div>

      {/* Info cards (key metrics at a glance) */}
      <FeatureInfoCards item={item} />

      <Separator />

      {/* Tabs (detailed information) */}
      <FeatureTabs item={item} />

      <Separator />

      {/* ─── Danger Zone ──────────────────────────────────────── */}
      <div className="border-destructive/15 bg-destructive/[0.02] overflow-hidden rounded-xl border">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="text-destructive mt-0.5 size-4.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">{t('detail.dangerZone')}</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {t('detail.dangerDescription')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => setDeleteOpen(true)}
              disabled={!!item.deletedAt}
            >
              <Trash2 className="size-3.5" />
              {t('detail.deleteItem')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <DeleteFeatureDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={item.name}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Detail Page Rules:**
- Accept `id` as a prop (NOT from `useParams` — testing friendly)
- States: loading → not found → editing → viewing
- Edit mode renders the full form component (not inline editing)
- Danger zone is always at the bottom, visually distinct
- Delete navigates back to list on success

## 2. Info Cards (`<feature>-info-cards.tsx`)

Quick metrics displayed as a grid of cards above the tabs.

```typescript
import { useTranslation } from 'react-i18next';
import { Card } from '@repo/ui/components/base/card';
import { cn } from '@repo/ui/lib/utils';
import { DollarSign, Package, Layers, Eye } from '@repo/ui/lib/icons';
import { formatNOK, calcPriceWithVat } from '@repo/utils/price';
import type { FeatureDetail } from '@/hooks/useFeatures/types';

interface FeatureInfoCardsProps {
  item: FeatureDetail;
}

export default function FeatureInfoCards({ item }: FeatureInfoCardsProps) {
  const { t } = useTranslation('<feature>');

  const cards = [
    {
      label: t('infoCards.salePrice'),
      value: formatNOK(calcPriceWithVat(item.salePrice, item.vat)),
      subValue: t('infoCards.inclVat', { vat: item.vat }),
      icon: DollarSign,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-500/10',
    },
    {
      label: t('infoCards.totalStock'),
      value: String(item.totalStock),
      subValue: t('infoCards.acrossBatches', { count: item.inventories.length }),
      icon: Package,
      colorClass: item.totalStock === 0 ? 'text-red-600' : 'text-blue-600',
      bgClass: item.totalStock === 0 ? 'bg-red-500/10' : 'bg-blue-500/10',
    },
    {
      label: t('infoCards.categories'),
      value: String(item.categories.length),
      subValue: item.categories.slice(0, 2).map(c => c.name).join(', '),
      icon: Layers,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-500/10',
    },
    {
      label: t('infoCards.visibility'),
      value: t(`visibility.${item.visibility}`),
      icon: Eye,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', card.bgClass)}>
              <card.icon className={cn('size-5', card.colorClass)} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
              <p className="text-lg font-bold">{card.value}</p>
              {card.subValue ? (
                <p className="text-muted-foreground truncate text-xs">{card.subValue}</p>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

## 3. Tabs Component (`<feature>-tabs.tsx`)

```typescript
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/base/tabs';
import OverviewTab from './overview-tab';
import PricingTab from './pricing-tab';
import InventoryTab from './inventory-tab';
import type { FeatureDetail } from '@/hooks/useFeatures/types';

interface FeatureTabsProps {
  item: FeatureDetail;
}

export default function FeatureTabs({ item }: FeatureTabsProps) {
  const { t } = useTranslation('<feature>');

  return (
    <Tabs defaultValue="overview">
      <TabsList className="bg-muted">
        <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
        <TabsTrigger value="inventory">
          {/* Show count in tab label */}
          {t('tabs.inventory')} ({item.inventories.length})
        </TabsTrigger>
        <TabsTrigger value="pricing">{t('tabs.pricing')}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab item={item} />
      </TabsContent>
      <TabsContent value="inventory">
        <InventoryTab item={item} />
      </TabsContent>
      <TabsContent value="pricing">
        <PricingTab item={item} />
      </TabsContent>
    </Tabs>
  );
}
```

**Tab Rules:**
- Each tab content is a separate component (not inline)
- Show relevant counts in tab labels when applicable
- First tab is always `defaultValue`

## 4. Tab Content: SectionCard Pattern

Use a consistent `SectionCard` pattern for grouping related fields:

```typescript
// overview-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from '@repo/ui/lib/icons';

interface SectionCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, children }: SectionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={cn('flex size-7 items-center justify-center rounded-lg', iconBg)}>
            <Icon className={cn('size-3.5', iconColor)} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Field display pattern
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right">{value || '—'}</span>
    </div>
  );
}

// Usage in tab
export default function OverviewTab({ item }: { item: FeatureDetail }) {
  const { t } = useTranslation('<feature>');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        icon={FileText}
        iconBg="bg-foreground/[0.06]"
        iconColor="text-foreground/70"
        title={t('overview.basicInfo')}
      >
        <div className="divide-y">
          <Field label={t('overview.name')} value={item.name} />
          <Field label={t('overview.description')} value={item.description} />
          <Field label={t('overview.sku')} value={item.sku} />
          <Field label={t('overview.barcode')} value={item.barcode} />
        </div>
      </SectionCard>

      <SectionCard
        icon={Settings}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-600"
        title={t('overview.settings')}
      >
        <div className="divide-y">
          <Field label={t('overview.status')} value={<StatusBadge isActive={item.isActive} />} />
          <Field label={t('overview.visibility')} value={t(`visibility.${item.visibility}`)} />
        </div>
      </SectionCard>
    </div>
  );
}
```

**SectionCard Rules:**
- Icon with colored background in header
- Fields as label-value pairs with dividers
- Use `'—'` (em dash) for empty/null values
- Grid layout: 1 col mobile, 2 cols desktop

## 5. Tab Content: Table Pattern (Inventory)

```typescript
// inventory-tab.tsx
export default function InventoryTab({ item }: { item: FeatureDetail }) {
  const { t } = useTranslation('<feature>');

  if (item.inventories.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">{t('inventoryTab.empty')}</p>
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('inventoryTab.batchId')}</TableHead>
            <TableHead>{t('inventoryTab.quantity')}</TableHead>
            <TableHead>{t('inventoryTab.expirationDate')}</TableHead>
            <TableHead>{t('inventoryTab.added')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {item.inventories.map((inv) => {
            const isExpired = inv.expirationDate && new Date(inv.expirationDate) < new Date();
            return (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.id.slice(0, 8)}</TableCell>
                <TableCell>{inv.quantity}</TableCell>
                <TableCell className={cn(isExpired && 'text-destructive')}>
                  {inv.expirationDate ? formatShortDate(inv.expirationDate) : '—'}
                  {isExpired ? ` (${t('inventoryTab.expired')})` : ''}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatShortDate(inv.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
```

## 6. Delete Dialog (`common/delete-<feature>-dialog.tsx`)

```typescript
import { useTranslation, Trans } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from '@repo/ui/components/base/dialog';
import { Button } from '@repo/ui/components/base/button';
import { AlertTriangle } from '@repo/ui/lib/icons';

interface DeleteFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export default function DeleteFeatureDialog({
  open, onOpenChange, itemName, onConfirm, isPending,
}: DeleteFeatureDialogProps) {
  const { t } = useTranslation('<feature>');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-destructive/10 ring-destructive/20 mb-3 flex size-12 items-center justify-center rounded-xl ring-1">
            <AlertTriangle className="text-destructive size-6" />
          </div>
          <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteDialog.description"
              ns="<feature>"
              values={{ name: itemName }}
              components={{ 1: <span className="text-foreground font-semibold" /> }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{t('deleteDialog.cancel')}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? t('deleteDialog.deleting') : t('deleteDialog.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Delete Dialog Rules:**
- Always use `<Trans>` with bold name for clarity
- Disable confirm button while pending
- Show "Deleting..." text during pending state
- Close dialog on success (handled by parent)
- Use `DialogClose` for cancel button (auto-closes)

## 7. Common Components

### Status Badge

```typescript
// common/status-badge.tsx
import { useTranslation } from 'react-i18next';
import { Badge } from '@repo/ui/components/base/badge';

interface StatusBadgeProps {
  isActive: boolean;
  deletedAt?: string | null;
}

export default function StatusBadge({ isActive, deletedAt }: StatusBadgeProps) {
  const { t } = useTranslation('<feature>');

  if (deletedAt) {
    return (
      <Badge className="border-destructive/30 bg-destructive/5 text-destructive gap-1.5 border">
        <span className="bg-destructive size-2 rounded-full" />
        {t('statusBadge.deleted')}
      </Badge>
    );
  }

  return (
    <Badge className={isActive
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1.5 border'
      : 'border-border bg-muted text-muted-foreground gap-1.5 border'
    }>
      <span className={isActive ? 'bg-emerald-500 size-2 rounded-full' : 'bg-muted-foreground size-2 rounded-full'} />
      {isActive ? t('statusBadge.active') : t('statusBadge.inactive')}
    </Badge>
  );
}
```

**Badge Pattern:**
- Colored dot + text
- Three states: active (green), inactive (muted), deleted (red)
- Always check `deletedAt` first (takes priority)

## Common Mistakes to Avoid

1. **NEVER call `useParams` inside detail page** — accept `id` as prop from route wrapper
2. **NEVER render the form inline** — use edit mode toggle that replaces the entire view
3. **NEVER skip the "not found" state** — always handle `!item` after loading completes
4. **NEVER put the delete dialog at page level** — co-locate it where the delete trigger is
5. **NEVER forget to navigate back after successful delete** — redirect to list page
6. **NEVER show danger zone for already-deleted items** — disable the button
7. **ALWAYS use `<Trans>` for delete description** — allows bold name within sentence
8. **ALWAYS show "Back" button in header** — don't trap users on detail pages
9. **ALWAYS show creation date in header subtitle** — gives context
10. **ALWAYS use `formatShortDate()`** from `@repo/utils/date` — consistent date formatting
11. **ALWAYS use `'—'` for null/empty field values** — not "N/A" or blank
