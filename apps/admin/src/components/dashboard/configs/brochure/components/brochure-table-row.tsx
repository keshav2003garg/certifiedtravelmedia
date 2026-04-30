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
import {
  Boxes,
  FileImage,
  Image,
  MoreHorizontal,
  Pencil,
  Trash2,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatShortDate } from '@repo/utils/date';

import type { Brochure } from '@/hooks/useBrochures/types';

interface BrochureTableRowProps {
  brochure: Brochure;
  isDeleting: boolean;
  onEdit: (brochure: Brochure) => void;
  onDelete: (brochure: Brochure) => void;
  onManageImages: (brochure: Brochure) => void;
}

function BrochureTableRow({
  brochure,
  isDeleting,
  onEdit,
  onDelete,
  onManageImages,
}: BrochureTableRowProps) {
  return (
    <TableRow className={cn(isDeleting && 'pointer-events-none opacity-50')}>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {brochure.primaryImageUrl ? (
              <img
                src={brochure.primaryImageUrl}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <FileImage className="size-5" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{brochure.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              Created {formatShortDate(brochure.createdAt)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="max-w-40 rounded-md">
          <span className="truncate">{brochure.brochureTypeName}</span>
        </Badge>
      </TableCell>
      <TableCell>
        {brochure.customerName ? (
          <span className="truncate text-sm font-medium">
            {brochure.customerName}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="gap-1.5 rounded-md">
            <Image className="size-3" />
            {brochure.imageCount}
          </Badge>
          <Badge variant="outline" className="gap-1.5 rounded-md">
            <Boxes className="size-3" />
            {brochure.packSizeCount}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatShortDate(brochure.updatedAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onManageImages(brochure)}>
              <Image className="mr-2 size-4" />
              Images and packs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(brochure)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(brochure)}
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

export default memo(BrochureTableRow);
