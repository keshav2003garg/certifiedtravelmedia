import { useCallback } from 'react';

import { useLoaderData } from '@tanstack/react-router';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle } from '@repo/ui/lib/icons';

import { useInventoryRequests } from '@/hooks/useInventoryRequests';
import { useUserRole } from '@/hooks/useUserRole';

import InventoryRequestForm from './components/inventory-request-form';

import type { CreateInventoryRequestPayload } from '@/hooks/useInventoryRequests/types';

function StaffOnlyAccessCard() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-normal">
          Staff intake only
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Managers and admins will review inventory requests from a separate
          queue.
        </p>
      </CardContent>
    </Card>
  );
}

function NewInventoryIntakePage() {
  const { user } = useLoaderData({ from: '/dashboard' });
  const { role } = useUserRole();
  const { createMutation } = useInventoryRequests();
  const isStaffOnly = role === 'staff';

  const handleSubmit = useCallback(
    (values: CreateInventoryRequestPayload, onSuccess: () => void) => {
      createMutation.mutate(values, { onSuccess });
    },
    [createMutation],
  );

  if (!isStaffOnly) {
    return <StaffOnlyAccessCard />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-normal">
          New Inventory Intake
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Submit received inventory for manager review without changing actual
          stock.
        </p>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <InventoryRequestForm
            ownerId={user.id}
            isSubmitting={createMutation.isPending}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default NewInventoryIntakePage;
