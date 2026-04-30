import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, Plus, RefreshCw } from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useUsers } from '@/hooks/useUsers';
import { useUsersFilters } from '@/hooks/useUsers/useUsersFilters';

import BanUserDialog from './components/ban-user-dialog';
import CreateUserDialog from './components/create-user-dialog';
import DeleteUserDialog from './components/delete-user-dialog';
import EditUserDialog from './components/edit-user-dialog';
import ResetPasswordDialog from './components/reset-password-dialog';
import UsersEmpty from './components/users-empty';
import UsersFilterBar from './components/users-filter-bar';
import UsersSkeleton from './components/users-skeleton';
import UsersTable from './components/users-table';

import type {
  BanUserPayload,
  CreateUserPayload,
  ResetPasswordPayload,
  UserWithRole,
} from '@/hooks/useUsers/types';
import type { EditUserFormData } from './schema';

function UsersPage() {
  const {
    banMutation,
    createMutation,
    removeMutation,
    resetPasswordMutation,
    setRoleMutation,
    unbanMutation,
    updateMutation,
    usersQueryOptions,
  } = useUsers();
  const filters = useUsersFilters();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [banTarget, setBanTarget] = useState<UserWithRole | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] =
    useState<UserWithRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    usersQueryOptions(filters.params),
  );

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const handleCreate = useCallback(
    (values: CreateUserPayload) => {
      createMutation.mutate(values, {
        onSuccess: () => setCreateOpen(false),
      });
    },
    [createMutation],
  );

  const closeEditDialog = useCallback((open: boolean) => {
    if (!open) setEditingUser(null);
  }, []);

  const handleUpdate = useCallback(
    async (values: EditUserFormData & { userId: string }) => {
      if (!editingUser) return;

      const nameChanged = values.name !== editingUser.name;
      const roleChanged = values.role !== editingUser.role;

      if (!nameChanged && !roleChanged) {
        setEditingUser(null);
        return;
      }

      setActionUserId(values.userId);

      try {
        if (nameChanged) {
          await updateMutation.mutateAsync({
            userId: values.userId,
            data: { name: values.name },
          });
        }

        if (roleChanged) {
          await setRoleMutation.mutateAsync({
            userId: values.userId,
            role: values.role,
          });
        }

        setEditingUser(null);
      } finally {
        setActionUserId(null);
      }
    },
    [editingUser, setRoleMutation, updateMutation],
  );

  const closeBanDialog = useCallback((open: boolean) => {
    if (!open) setBanTarget(null);
  }, []);

  const handleBan = useCallback(
    (values: BanUserPayload) => {
      setActionUserId(values.userId);
      banMutation.mutate(values, {
        onSuccess: () => setBanTarget(null),
        onSettled: () => setActionUserId(null),
      });
    },
    [banMutation],
  );

  const handleUnban = useCallback(
    (user: UserWithRole) => {
      setActionUserId(user.id);
      unbanMutation.mutate(user.id, {
        onSettled: () => setActionUserId(null),
      });
    },
    [unbanMutation],
  );

  const closeResetPasswordDialog = useCallback((open: boolean) => {
    if (!open) setResetPasswordTarget(null);
  }, []);

  const handleResetPassword = useCallback(
    (values: ResetPasswordPayload) => {
      setActionUserId(values.userId);
      resetPasswordMutation.mutate(values, {
        onSuccess: () => setResetPasswordTarget(null),
        onSettled: () => setActionUserId(null),
      });
    },
    [resetPasswordMutation],
  );

  const closeDeleteDialog = useCallback((open: boolean) => {
    if (!open) setDeleteTarget(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;

    setActionUserId(deleteTarget.id);
    removeMutation.mutate(
      { userId: deleteTarget.id },
      {
        onSuccess: () => setDeleteTarget(null),
        onSettled: () => setActionUserId(null),
      },
    );
  }, [deleteTarget, removeMutation]);

  if (isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-normal">
            Users could not be loaded
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Refresh the list or try again after checking the auth connection.
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
            Users
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Manage dashboard access, roles, account status, and credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh users"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add user
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <UsersFilterBar filters={filters} />

          {isLoading ? (
            <UsersSkeleton />
          ) : users.length === 0 ? (
            <UsersEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              onCreate={() => setCreateOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              <UsersTable
                users={users}
                actionUserId={actionUserId}
                onEdit={setEditingUser}
                onBan={setBanTarget}
                onUnban={handleUnban}
                onResetPassword={setResetPasswordTarget}
                onDelete={setDeleteTarget}
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

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
      <EditUserDialog
        open={Boolean(editingUser)}
        onOpenChange={closeEditDialog}
        user={editingUser}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending || setRoleMutation.isPending}
      />
      <BanUserDialog
        open={Boolean(banTarget)}
        onOpenChange={closeBanDialog}
        user={banTarget}
        onSubmit={handleBan}
        isSubmitting={banMutation.isPending}
      />
      <ResetPasswordDialog
        open={Boolean(resetPasswordTarget)}
        onOpenChange={closeResetPasswordDialog}
        user={resetPasswordTarget}
        onSubmit={handleResetPassword}
        isSubmitting={resetPasswordMutation.isPending}
      />
      <DeleteUserDialog
        open={Boolean(deleteTarget)}
        onOpenChange={closeDeleteDialog}
        user={deleteTarget}
        onConfirm={handleDelete}
        isDeleting={removeMutation.isPending}
      />
    </div>
  );
}

export default UsersPage;
