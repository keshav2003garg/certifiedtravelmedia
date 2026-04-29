import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
import { TableCell, TableRow } from '@repo/ui/components/base/table';
import { MoreHorizontal, Pencil, Trash2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';

import type { BrochureType } from '@/hooks/useBrochureTypes/types';

interface BrochureTypesTableRowProps {
  brochureType: BrochureType;
  isDeleting: boolean;
  onEdit: (brochureType: BrochureType) => void;
  onDelete: (brochureType: BrochureType) => void;
}

function BrochureTypesTableRow({
  brochureType,
  isDeleting,
  onEdit,
  onDelete,
}: BrochureTypesTableRowProps) {
  return (
    <TableRow className={cn(isDeleting && 'pointer-events-none opacity-50')}>
      <TableCell>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{brochureType.name}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="rounded-md">
          {brochureType.colSpan} columns
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(brochureType.createdAt)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(brochureType.updatedAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(brochureType)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(brochureType)}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default memo(BrochureTypesTableRow);
