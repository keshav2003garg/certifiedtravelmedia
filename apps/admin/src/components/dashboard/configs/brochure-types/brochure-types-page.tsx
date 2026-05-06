import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, Plus } from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { useBrochureTypesFilters } from '@/hooks/useBrochureTypes/useBrochureTypesFilters';

import BrochureTypeFormDialog from './components/brochure-type-form-dialog';
import BrochureTypesEmpty from './components/brochure-types-empty';
import BrochureTypesFilterBar from './components/brochure-types-filter-bar';
import BrochureTypesSkeleton from './components/brochure-types-skeleton';
import BrochureTypesTable from './components/brochure-types-table';
import DeleteBrochureTypeDialog from './components/delete-brochure-type-dialog';

import type { BrochureType } from '@/hooks/useBrochureTypes/types';

function BrochureTypesPage() {
  const { brochureTypesQueryOptions, deleteMutation } = useBrochureTypes();
  const filters = useBrochureTypesFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrochureType, setEditingBrochureType] =
    useState<BrochureType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrochureType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    brochureTypesQueryOptions(filters.params),
  );

  const brochureTypes = data?.brochureTypes ?? [];
  const pagination = data?.pagination;

  const openCreateDialog = useCallback(() => {
    setEditingBrochureType(null);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((brochureType: BrochureType) => {
    setEditingBrochureType(brochureType);
    setFormOpen(true);
  }, []);

  const openDeleteDialog = useCallback((brochureType: BrochureType) => {
    setDeleteTarget(brochureType);
  }, []);

  const closeDeleteDialog = useCallback((open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onSettled: () => setDeletingId(null),
    });
  }, [deleteMutation, deleteTarget]);

  if (isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-normal">
            Brochure types could not be loaded
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Refresh the list or try again after checking the API connection.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Brochure Types
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Configure brochure categories and the grid width each type occupies
            in chart layouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            New type
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <BrochureTypesFilterBar filters={filters} />

          {isLoading ? (
            <BrochureTypesSkeleton />
          ) : brochureTypes.length === 0 ? (
            <BrochureTypesEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              onCreate={openCreateDialog}
            />
          ) : (
            <div className="space-y-4">
              <BrochureTypesTable
                brochureTypes={brochureTypes}
                deletingId={deletingId}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
              {pagination ? (
                <DataPaginationControls
                  pagination={pagination}
                  currentLimit={filters.limit}
                  onPageChange={filters.handlePageChange}
                  onLimitChange={filters.handleLimitChange}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <BrochureTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        brochureType={editingBrochureType}
      />
      <DeleteBrochureTypeDialog
        open={Boolean(deleteTarget)}
        brochureType={deleteTarget}
        isDeleting={deleteMutation.isPending}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default BrochureTypesPage;
