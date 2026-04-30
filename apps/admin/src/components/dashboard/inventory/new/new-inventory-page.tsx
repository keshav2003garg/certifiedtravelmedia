import { useCallback } from 'react';

import { useLoaderData } from '@tanstack/react-router';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle } from '@repo/ui/lib/icons';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useUserRole } from '@/hooks/useUserRole';

import InventoryIntakeForm from './components/inventory-intake-form';

import type { CreateInventoryIntakePayload } from '@/hooks/useInventoryItems/types';

function ManagersOnlyAccessCard() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-normal">Managers only</h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Only managers and admins can add inventory directly. Staff should
          submit an intake request instead.
        </p>
      </CardContent>
    </Card>
  );
}

function NewInventoryPage() {
  const { role } = useUserRole();
  const { user } = useLoaderData({ from: '/dashboard' });

  const { createIntakeMutation } = useInventoryItems();

  const canManage = role === 'manager' || role === 'admin';

  const handleSubmit = useCallback(
    (values: CreateInventoryIntakePayload, onSuccess: () => void) => {
      createIntakeMutation.mutate(values, { onSuccess });
    },
    [createIntakeMutation],
  );

  if (!canManage) {
    return <ManagersOnlyAccessCard />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-normal">
          New Inventory
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Add stock directly into a warehouse and record the matching
          transaction.
        </p>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <InventoryIntakeForm
            ownerId={user.id}
            isSubmitting={createIntakeMutation.isPending}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default NewInventoryPage;
