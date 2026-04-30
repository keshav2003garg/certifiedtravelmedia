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
import { Textarea } from '@repo/ui/components/base/textarea';

import type { ChartTile } from '@/hooks/useChartEditor/types';

export interface FlagTileDialogState {
  tile: ChartTile;
  note: string;
}

interface FlagTileDialogProps {
  state: FlagTileDialogState | null;
  onStateChange: (state: FlagTileDialogState | null) => void;
  onSubmit: () => void;
}

export const FlagTileDialog = memo(function FlagTileDialog({
  state,
  onStateChange,
  onSubmit,
}: FlagTileDialogProps) {
  return (
    <Dialog
      open={Boolean(state)}
      onOpenChange={(open) => {
        if (!open) onStateChange(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag tile</DialogTitle>
          <DialogDescription>
            Add a note so other admins know why this tile needs attention.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={state?.note ?? ''}
          onChange={(event) =>
            onStateChange(
              state ? { ...state, note: event.target.value } : state,
            )
          }
          placeholder="Add a flag note"
          rows={4}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onStateChange(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!state?.note.trim()}
          >
            Save flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
