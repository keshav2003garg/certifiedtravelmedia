import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';
import { CheckCircle, Copy, Loader2, Printer, Save } from '@repo/ui/lib/icons';

interface ChartActionsProps {
  isPersisted: boolean;
  isLocked: boolean;
  isDraft: boolean;
  unplacedPaidCount: number;
  isPastMonth: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCloning: boolean;
  isPrinting: boolean;
  isManager: boolean;
  onSave: () => void;
  onComplete: () => void;
  onClone: () => void;
  onPrint: () => void;
}

export const ChartActions = memo(function ChartActions({
  isPersisted,
  isLocked,
  isDraft,
  unplacedPaidCount,
  isPastMonth,
  isSaving,
  isCompleting,
  isCloning,
  isPrinting,
  isManager,
  onSave,
  onComplete,
  onClone,
  onPrint,
}: ChartActionsProps) {
  const buttonClassName = 'h-8 gap-1 px-2 text-xs';

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        onClick={onPrint}
        disabled={isPrinting}
        className={buttonClassName}
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {isPrinting ? 'Opening...' : 'Print'}
      </Button>

      {isPersisted && isManager && !isLocked && !isPastMonth && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={onSave}
                    disabled={isSaving || unplacedPaidCount > 0}
                    className={buttonClassName}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </span>
              </TooltipTrigger>
              {unplacedPaidCount > 0 && (
                <TooltipContent>
                  {unplacedPaidCount === 1
                    ? '1 paid brochure is not yet placed on the chart'
                    : `${unplacedPaidCount} paid brochures are not yet placed on the chart`}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {isDraft && (
            <Button
              variant="outline"
              onClick={onComplete}
              disabled={isCompleting}
              className={buttonClassName}
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isCompleting ? 'Locking...' : 'Lock'}
            </Button>
          )}
        </>
      )}

      {isPersisted && isManager && !isPastMonth && (
        <Button
          variant="outline"
          onClick={onClone}
          disabled={isCloning}
          className={buttonClassName}
        >
          {isCloning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCloning ? 'Cloning...' : 'Clone Next Month'}
        </Button>
      )}
    </div>
  );
});
