import { memo, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import {
  BROCHURE_TYPE_COL_SPAN_MAX,
  brochureTypeFormSchema,
  defaultBrochureTypeValues,
} from '../schema';

import type { BrochureType } from '@/hooks/useBrochureTypes/types';
import type { BrochureTypeFormData } from '../schema';

interface BrochureTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brochureType: BrochureType | null;
}

function getChangedFields(
  data: BrochureTypeFormData,
  brochureType: BrochureType,
) {
  const body: Partial<BrochureTypeFormData> = {};

  if (data.name !== brochureType.name) {
    body.name = data.name;
  }

  if (data.colSpan !== brochureType.colSpan) {
    body.colSpan = data.colSpan;
  }

  return body;
}

function BrochureTypeFormDialog({
  open,
  onOpenChange,
  brochureType,
}: BrochureTypeFormDialogProps) {
  const { createMutation, updateMutation } = useBrochureTypes();
  const isEditMode = Boolean(brochureType);
  const mutation = isEditMode ? updateMutation : createMutation;

  const defaultValues = useMemo<BrochureTypeFormData>(() => {
    if (!brochureType) return defaultBrochureTypeValues;

    return {
      name: brochureType.name,
      colSpan: brochureType.colSpan,
    };
  }, [brochureType]);

  const form = useForm<BrochureTypeFormData>({
    resolver: zodResolver(brochureTypeFormSchema),
    defaultValues,
  });

  useResetFormOnActivation(
    open,
    form.reset,
    defaultValues,
    brochureType?.id ?? null,
  );

  function onSubmit(data: BrochureTypeFormData) {
    if (!brochureType) {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
      return;
    }

    const body = getChangedFields(data, brochureType);

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { id: brochureType.id, body },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit brochure type' : 'New brochure type'}
          </DialogTitle>
          <DialogDescription>
            Configure the label and grid span used when brochures are placed on
            chart layouts.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Rack Card"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colSpan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column span</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      min={1}
                      max={BROCHURE_TYPE_COL_SPAN_MAX}
                      integerOnly
                      placeholder="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {isEditMode ? 'Save changes' : 'Create type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BrochureTypeFormDialog);
