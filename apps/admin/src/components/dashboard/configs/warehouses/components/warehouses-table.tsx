import { memo } from 'react';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';

import WarehousesTableRow from './warehouses-table-row';

import type { Warehouse } from '@/hooks/useWarehouses/types';

interface WarehousesTableProps {
  warehouses: Warehouse[];
  retiringId: string | null;
  downloadingFullTruckLoadId: string | null;
  onEdit: (warehouse: Warehouse) => void;
  onRetire: (warehouse: Warehouse) => void;
  onDownloadFullTruckLoad: (warehouse: Warehouse) => void;
}

function WarehousesTable({
  warehouses,
  retiringId,
  downloadingFullTruckLoadId,
  onEdit,
  onRetire,
  onDownloadFullTruckLoad,
}: WarehousesTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '980px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[22%]">Warehouse</TableHead>
              <TableHead className="w-[12%]">Warehouse ID</TableHead>
              <TableHead>Sectors</TableHead>
              <TableHead className="w-[9%]">Status</TableHead>
              <TableHead className="w-[12%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <WarehousesTableRow
                key={warehouse.id}
                warehouse={warehouse}
                isRetiring={retiringId === warehouse.id}
                isDownloadingFullTruckLoad={
                  downloadingFullTruckLoadId === warehouse.id
                }
                isFullTruckLoadDownloadDisabled={Boolean(
                  downloadingFullTruckLoadId,
                )}
                onEdit={onEdit}
                onRetire={onRetire}
                onDownloadFullTruckLoad={onDownloadFullTruckLoad}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(WarehousesTable);
