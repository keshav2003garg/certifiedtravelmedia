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
      <Table className="table-fixed" style={{ minWidth: '760px' }}>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead className="w-[18%]">Column span</TableHead>
            <TableHead className="w-[18%]">Created</TableHead>
            <TableHead className="w-[18%]">Updated</TableHead>
            <TableHead className="w-[6%]" />
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
