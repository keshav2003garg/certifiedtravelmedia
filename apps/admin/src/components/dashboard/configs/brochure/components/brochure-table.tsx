import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import BrochureTableRow from './brochure-table-row';

import type { Brochure } from '@/hooks/useBrochures/types';

interface BrochureTableProps {
  brochures: Brochure[];
  deletingId: string | null;
  onEdit: (brochure: Brochure) => void;
  onDelete: (brochure: Brochure) => void;
  onManageImages: (brochure: Brochure) => void;
}

function BrochureTable({
  brochures,
  deletingId,
  onEdit,
  onDelete,
  onManageImages,
}: BrochureTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="table-fixed" style={{ minWidth: '980px' }}>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[34%]">Brochure</TableHead>
            <TableHead className="w-[17%]">Type</TableHead>
            <TableHead className="w-[17%]">Customer</TableHead>
            <TableHead className="w-[15%]">Assets</TableHead>
            <TableHead className="w-[11%]">Updated</TableHead>
            <TableHead className="w-[6%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {brochures.map((brochure) => (
            <BrochureTableRow
              key={brochure.id}
              brochure={brochure}
              isDeleting={deletingId === brochure.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageImages={onManageImages}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default memo(BrochureTable);
