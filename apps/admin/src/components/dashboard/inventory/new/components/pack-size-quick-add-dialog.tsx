import { memo } from 'react';

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
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';
import { z } from '@repo/utils/zod';

import { useBrochures } from '@/hooks/useBrochures';
import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

const formSchema = z.object({
  unitsPerBox: z
    .number()
    .positive('Units per box must be greater than 0')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: 'Units per box can have at most two decimal places',
    }),
});

type FormData = z.infer<typeof formSchema>;

interface PackSizeQuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brochureId: string;
  imageId: string;
  onCreated?: (packSizeId: string) => void;
}

function PackSizeQuickAddDialog({
  open,
  onOpenChange,
  brochureId,
  imageId,
  onCreated,
}: PackSizeQuickAddDialogProps) {
  const { createImagePackSizeMutation } = useBrochures();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { unitsPerBox: 0 },
  });

  useResetFormOnActivation(open, form.reset, { unitsPerBox: 0 });

  function handleSubmit(values: FormData) {
    createImagePackSizeMutation.mutate(
      {
        brochureId,
        imageId,
        body: { unitsPerBox: values.unitsPerBox },
      },
      {
        onSuccess: (response) => {
          onCreated?.(response.packSize.id);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add pack size</DialogTitle>
          <DialogDescription>
            Add a new pack size to the selected brochure image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="unitsPerBox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units per box</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      min={0.01}
                      step={0.01}
                      decimals={2}
                      placeholder="225"
                      disabled={createImagePackSizeMutation.isPending}
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
                disabled={createImagePackSizeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createImagePackSizeMutation.isPending}
              >
                {createImagePackSizeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Add pack size
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(PackSizeQuickAddDialog);
