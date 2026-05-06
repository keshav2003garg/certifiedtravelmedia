import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import BrochureTypesTableRow from './brochure-types-table-row';

import type { BrochureType } from '@/hooks/useBrochureTypes/types';

interface BrochureTypesTableProps {
  brochureTypes: BrochureType[];
  deletingId: string | null;
  onEdit: (brochureType: BrochureType) => void;
  onDelete: (brochureType: BrochureType) => void;
}

function BrochureTypesTable({
  brochureTypes,
  deletingId,
  onEdit,
  onDelete,
}: BrochureTypesTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="table-fixed" style={{ minWidth: '620px' }}>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[50%]">Name</TableHead>
            <TableHead className="w-[22%]">Column span</TableHead>
            <TableHead className="w-[20%]">Created</TableHead>
            <TableHead className="w-[8%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {brochureTypes.map((brochureType) => (
            <BrochureTypesTableRow
              key={brochureType.id}
              brochureType={brochureType}
              isDeleting={deletingId === brochureType.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default memo(BrochureTypesTable);
