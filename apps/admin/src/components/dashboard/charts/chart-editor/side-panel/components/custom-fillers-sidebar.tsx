import { memo, useCallback, useMemo, useState } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { Loader2, Plus, Square, UserRound } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import SearchableSelect from '@/components/common/searchable-select';

import { useChartEditor } from '@/hooks/useChartEditor';
import { useCustomers } from '@/hooks/useCustomers';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { DragEvent, FormEvent } from 'react';
import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ChartCustomFiller } from '@/hooks/useChartEditor/types';
import type {
  ListCustomersRequest,
  SortOrder as CustomerSortOrder,
} from '@/hooks/useCustomers/types';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';

export const CHART_CUSTOM_FILLER_DRAG_MIME_TYPE =
  'application/x-chart-custom-filler-id';

interface CustomFillersSidebarProps {
  fillers: ChartCustomFiller[];
  isLocked: boolean;
  isCompact?: boolean;
  hasEmptyCells: boolean;
  canPlaceFiller: (filler: ChartCustomFiller) => boolean;
  onAddFiller: (filler: ChartCustomFiller) => void;
  onFillerDragStart: (filler: ChartCustomFiller) => void;
  onFillerDragEnd: () => void;
}

type CustomerOptionData = ListCustomersRequest['response']['data'];

function getDisabledReason(
  filler: ChartCustomFiller,
  props: Pick<
    CustomFillersSidebarProps,
    'isLocked' | 'hasEmptyCells' | 'canPlaceFiller'
  >,
) {
  if (props.isLocked) return 'Locked';
  if (!props.hasEmptyCells) return 'Full';
  if (!props.canPlaceFiller(filler)) return 'No slot';

  return null;
}

function createCustomFillerDragPreview(filler: ChartCustomFiller) {
  const preview = document.createElement('div');
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    zIndex: '9999',
    width: '220px',
    padding: '9px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#f3f4f6',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
    color: '#374151',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  });

  const name = document.createElement('div');
  name.textContent = filler.name;
  Object.assign(name.style, {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '16px',
  });

  const meta = document.createElement('div');
  meta.textContent = filler.customerName;
  Object.assign(meta.style, {
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#6b7280',
    fontSize: '10px',
    lineHeight: '14px',
  });

  preview.append(name, meta);
  document.body.appendChild(preview);

  return preview;
}

export const CustomFillersSidebar = memo(function CustomFillersSidebar({
  fillers,
  isLocked,
  isCompact = false,
  hasEmptyCells,
  canPlaceFiller,
  onAddFiller,
  onFillerDragStart,
  onFillerDragEnd,
}: CustomFillersSidebarProps) {
  const { createCustomFillerMutation } = useChartEditor();
  const { getCustomers } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectCustomerOptions = useCallback(
    (data: CustomerOptionData | undefined): SearchableSelectOption[] =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.acumaticaId,
      })),
    [],
  );

  const selectedCustomerOption = useMemo<SearchableSelectOption | null>(() => {
    const customer = fillers.find((filler) => filler.customerId === customerId);

    if (!customer) return null;

    return {
      value: customer.customerId,
      label: customer.customerName,
      description: customer.customerAcumaticaId,
    };
  }, [customerId, fillers]);

  const buildCustomerParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as CustomerSortOrder,
    }),
    [],
  );

  const {
    options: customerOptions,
    setSearch: setCustomerSearch,
    isSearching: isSearchingCustomers,
  } = useServerSearchSelectOptions({
    queryKey: (params: ListCustomersRequest['payload']) =>
      [ReactQueryKeys.GET_CUSTOMERS, 'custom-filler-dialog', params] as const,
    queryFn: getCustomers,
    selectOptions: selectCustomerOptions,
    buildParams: buildCustomerParams,
    baseOptions: selectedCustomerOption ? [selectedCustomerOption] : [],
    enabled: dialogOpen,
  });

  const resetForm = useCallback(() => {
    setName('');
    setCustomerId('');
    setFormError(null);
  }, []);

  const handleOpenDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (createCustomFillerMutation.isPending) return;

      setDialogOpen(open);
      if (!open) resetForm();
    },
    [createCustomFillerMutation.isPending, resetForm],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const normalizedName = name.trim().replace(/\s+/g, ' ');
      if (!normalizedName) {
        setFormError('Filler name is required');
        return;
      }

      if (!customerId) {
        setFormError('Customer is required');
        return;
      }

      setFormError(null);
      createCustomFillerMutation.mutate(
        { name: normalizedName, customerId },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        },
      );
    },
    [createCustomFillerMutation, customerId, name, resetForm],
  );

  function handleDragStart(
    filler: ChartCustomFiller,
    event: DragEvent<HTMLButtonElement>,
  ) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(CHART_CUSTOM_FILLER_DRAG_MIME_TYPE, filler.id);
    event.dataTransfer.setData('text/plain', filler.name);
    const dragPreview = createCustomFillerDragPreview(filler);
    event.dataTransfer.setDragImage(dragPreview, 24, 24);
    window.setTimeout(() => dragPreview.remove(), 0);
    onFillerDragStart(filler);
  }

  return (
    <Card
      className={cn(
        isCompact && 'flex min-h-0 flex-1 basis-0 flex-col overflow-hidden',
      )}
    >
      <CardHeader className={cn(isCompact ? 'px-3 py-2' : 'pb-3')}>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span>Custom Fillers</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-normal">
              {fillers.length} items
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              disabled={isLocked}
              onClick={handleOpenDialog}
              aria-label="Create custom filler"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('p-0', isCompact && 'min-h-0 flex-1')}>
        <div
          className={cn(
            'overflow-y-auto',
            isCompact ? 'h-full px-3 pb-3' : 'max-h-70 px-4 pb-4',
          )}
        >
          <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
            {fillers.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                No custom fillers
              </p>
            ) : (
              fillers.map((filler) => {
                const disabledReason = getDisabledReason(filler, {
                  isLocked,
                  hasEmptyCells,
                  canPlaceFiller,
                });
                const isDisabled = Boolean(disabledReason);

                return (
                  <button
                    key={filler.id}
                    type="button"
                    disabled={isDisabled}
                    draggable={!isDisabled}
                    onDragStart={(event) => handleDragStart(filler, event)}
                    onDragEnd={onFillerDragEnd}
                    onClick={() => onAddFiller(filler)}
                    className={cn(
                      'group flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors',
                      isDisabled
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70'
                        : 'cursor-grab border-gray-100 hover:border-gray-300 hover:bg-gray-50 active:cursor-grabbing',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-200 text-gray-600">
                      <Square className="size-4 fill-current" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">
                        {filler.name}
                      </span>
                      <span className="text-muted-foreground mt-1 block truncate text-[10px]">
                        {filler.customerName}
                      </span>
                    </span>

                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {disabledReason ?? 'Available'}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New custom filler</DialogTitle>
            <DialogDescription>
              Create a customer-backed filler tile for chart placement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-filler-name">Filler name</Label>
              <Input
                id="custom-filler-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lobby display"
                autoComplete="off"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <SearchableSelect
                options={customerOptions}
                value={customerId || undefined}
                onChange={setCustomerId}
                placeholder="Select customer"
                searchPlaceholder="Search customers"
                emptyMessage="No customers found"
                isLoading={isSearchingCustomers}
                icon={<UserRound className="size-4 shrink-0" />}
                onSearchChange={setCustomerSearch}
              />
            </div>

            {formError ? (
              <p className="text-destructive text-sm">{formError}</p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={createCustomFillerMutation.isPending}
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCustomFillerMutation.isPending}
              >
                {createCustomFillerMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Create filler
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
