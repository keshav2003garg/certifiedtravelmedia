import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, Plus, RefreshCw } from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useCustomers } from '@/hooks/useCustomers';
import { useCustomersFilters } from '@/hooks/useCustomers/useCustomersFilters';

import CustomerFormDialog from './components/customer-form-dialog';
import CustomersEmpty from './components/customers-empty';
import CustomersFilterBar from './components/customers-filter-bar';
import CustomersSkeleton from './components/customers-skeleton';
import CustomersTable from './components/customers-table';
import DeleteCustomerDialog from './components/delete-customer-dialog';

import type { Customer } from '@/hooks/useCustomers/types';

function CustomersPage() {
  const { customersQueryOptions, deleteMutation } = useCustomers();
  const filters = useCustomersFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    customersQueryOptions(filters.params),
  );

  const customers = data?.customers ?? [];
  const pagination = data?.pagination;

  const openCreateDialog = useCallback(() => {
    setEditingCustomer(null);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  }, []);

  const openDeleteDialog = useCallback((customer: Customer) => {
    setDeleteTarget(customer);
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
            Customers could not be loaded
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
            Customers
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Maintain customer identities used for brochure ownership, contracts,
            and Acumatica synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh customers"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            New customer
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <CustomersFilterBar filters={filters} />

          {isLoading ? (
            <CustomersSkeleton />
          ) : customers.length === 0 ? (
            <CustomersEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              onCreate={openCreateDialog}
            />
          ) : (
            <div className="space-y-4">
              <CustomersTable
                customers={customers}
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

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
      />
      <DeleteCustomerDialog
        open={Boolean(deleteTarget)}
        customer={deleteTarget}
        isDeleting={deleteMutation.isPending}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default CustomersPage;
