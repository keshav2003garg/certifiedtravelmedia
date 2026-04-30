import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { CheckCircle, Copy, Loader2, Save } from '@repo/ui/lib/icons';

interface ChartActionsProps {
  isLocked: boolean;
  isDraft: boolean;
  isPastMonth: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCloning: boolean;
  isManager: boolean;
  onSave: () => void;
  onComplete: () => void;
  onClone: () => void;
}

export const ChartActions = memo(function ChartActions({
  isLocked,
  isDraft,
  isPastMonth,
  isSaving,
  isCompleting,
  isCloning,
  isManager,
  onSave,
  onComplete,
  onClone,
}: ChartActionsProps) {
  if (!isManager) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isLocked && !isPastMonth && (
        <>
          <Button onClick={onSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          {isDraft && (
            <Button
              variant="outline"
              onClick={onComplete}
              disabled={isCompleting}
              className="gap-1.5"
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isCompleting ? 'Locking...' : 'Lock Chart'}
            </Button>
          )}
        </>
      )}

      {!isPastMonth && (
        <Button
          variant="outline"
          onClick={onClone}
          disabled={isCloning}
          className="gap-1.5"
        >
          {isCloning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCloning ? 'Cloning...' : 'Clone to Next Month'}
        </Button>
      )}
    </div>
  );
});
