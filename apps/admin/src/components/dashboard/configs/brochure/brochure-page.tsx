import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, Plus, RefreshCw } from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useBrochures } from '@/hooks/useBrochures';
import { useBrochuresFilters } from '@/hooks/useBrochures/useBrochuresFilters';

import BrochureEmpty from './components/brochure-empty';
import BrochureFilterBar from './components/brochure-filter-bar';
import BrochureFormDialog from './components/brochure-form-dialog';
import BrochureImagesDialog from './components/brochure-images-dialog';
import BrochureSkeleton from './components/brochure-skeleton';
import BrochureTable from './components/brochure-table';
import DeleteBrochureDialog from './components/delete-brochure-dialog';

import type { Brochure } from '@/hooks/useBrochures/types';

function BrochurePage() {
  const { brochuresQueryOptions, deleteMutation } = useBrochures();
  const filters = useBrochuresFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrochure, setEditingBrochure] = useState<Brochure | null>(null);
  const [imageTarget, setImageTarget] = useState<Brochure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brochure | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    brochuresQueryOptions(filters.params),
  );

  const brochures = data?.brochures ?? [];
  const pagination = data?.pagination;

  const openCreateDialog = useCallback(() => {
    setEditingBrochure(null);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((brochure: Brochure) => {
    setEditingBrochure(brochure);
    setFormOpen(true);
  }, []);

  const openImagesDialog = useCallback((brochure: Brochure) => {
    setImageTarget(brochure);
  }, []);

  const closeImagesDialog = useCallback((open: boolean) => {
    if (!open) {
      setImageTarget(null);
    }
  }, []);

  const openDeleteDialog = useCallback((brochure: Brochure) => {
    setDeleteTarget(brochure);
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
            Brochures could not be loaded
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
            Brochure
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Manage brochure records, customer assignment, image assets, and pack
            sizes used across inventory operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh brochures"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            New brochure
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <BrochureFilterBar filters={filters} />

          {isLoading ? (
            <BrochureSkeleton />
          ) : brochures.length === 0 ? (
            <BrochureEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              onCreate={openCreateDialog}
            />
          ) : (
            <div className="space-y-4">
              <BrochureTable
                brochures={brochures}
                deletingId={deletingId}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onManageImages={openImagesDialog}
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

      <BrochureFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        brochure={editingBrochure}
      />
      <BrochureImagesDialog
        open={Boolean(imageTarget)}
        onOpenChange={closeImagesDialog}
        brochure={imageTarget}
      />
      <DeleteBrochureDialog
        open={Boolean(deleteTarget)}
        brochure={deleteTarget}
        isDeleting={deleteMutation.isPending}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default BrochurePage;
