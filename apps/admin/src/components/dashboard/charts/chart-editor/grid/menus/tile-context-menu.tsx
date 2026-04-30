import { memo } from 'react';

import { Copy, Eye, Flag, Trash2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { ChartTile } from '@/hooks/useChartEditor/types';

export type TileContextMenuAction = 'view' | 'clone' | 'flag' | 'delete';

export interface TileContextMenuState {
  tile: ChartTile;
  x: number;
  y: number;
}

interface TileContextMenuProps {
  menu: TileContextMenuState;
  isLocked: boolean;
  hasEmptyCells: boolean;
  canClone: boolean;
  canDelete: boolean;
  canFlag: boolean;
  canUnflag: boolean;
  onAction: (action: TileContextMenuAction) => void;
}

function getMenuPosition(menu: TileContextMenuState) {
  if (typeof window === 'undefined') {
    return { left: menu.x, top: menu.y };
  }

  return {
    left: Math.max(8, Math.min(menu.x, window.innerWidth - 192)),
    top: Math.max(8, Math.min(menu.y, window.innerHeight - 176)),
  };
}

export const TileContextMenu = memo(function TileContextMenu({
  menu,
  isLocked,
  hasEmptyCells,
  canClone,
  canDelete,
  canFlag,
  canUnflag,
  onAction,
}: TileContextMenuProps) {
  const isCloneDisabled = isLocked || !hasEmptyCells || !canClone;
  const isFlagDisabled =
    isLocked || (menu.tile.isFlagged ? !canUnflag : !canFlag);
  const isDeleteDisabled = isLocked || !canDelete;

  return (
    <div
      role="menu"
      className="bg-popover text-popover-foreground fixed z-50 w-44 overflow-hidden rounded-md border p-1 text-sm shadow-lg"
      style={getMenuPosition(menu)}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left"
        onClick={() => onAction('view')}
      >
        <Eye className="size-4" />
        View details
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={isCloneDisabled}
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left',
          isCloneDisabled
            ? 'text-muted-foreground cursor-not-allowed opacity-60'
            : 'hover:bg-accent hover:text-accent-foreground',
        )}
        onClick={() => onAction('clone')}
      >
        <Copy className="size-4" />
        Copy tile
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={isFlagDisabled}
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left',
          isFlagDisabled
            ? 'text-muted-foreground cursor-not-allowed opacity-60'
            : 'hover:bg-accent hover:text-accent-foreground',
        )}
        onClick={() => onAction('flag')}
      >
        <Flag className="size-4" />
        {menu.tile.isFlagged ? 'Remove flag' : 'Flag tile'}
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={isDeleteDisabled}
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left',
          isDeleteDisabled
            ? 'text-muted-foreground cursor-not-allowed opacity-60'
            : 'text-destructive hover:bg-destructive/10',
        )}
        onClick={() => onAction('delete')}
      >
        <Trash2 className="size-4" />
        Remove tile
      </button>
    </div>
  );
});
