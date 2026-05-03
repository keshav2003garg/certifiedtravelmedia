import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import { formatShortDate } from '@repo/utils/date';
import { formatDecimal } from '@repo/utils/number';

import type { InventoryTransaction } from '@/hooks/useInventoryItems/types';

interface InventoryTransactionsTableProps {
  transactions: InventoryTransaction[];
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function InventoryTransactionsTable({
  transactions,
}: InventoryTransactionsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '980px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[12%]">Date</TableHead>
              <TableHead className="w-[16%]">Type</TableHead>
              <TableHead className="w-[12%]">Boxes</TableHead>
              <TableHead className="w-[18%]">Balance</TableHead>
              <TableHead className="w-[18%]">Recorded by</TableHead>
              <TableHead className="w-[24%]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm">
                  {formatShortDate(transaction.transactionDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-md">
                    {transaction.transactionType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatQuantity(transaction.boxes)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    {formatQuantity(transaction.balanceBeforeBoxes)}
                  </span>{' '}
                  to{' '}
                  <span className="text-foreground font-medium">
                    {formatQuantity(transaction.balanceAfterBoxes)}
                  </span>
                </TableCell>
                <TableCell>
                  {transaction.createdByName ? (
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">
                        {transaction.createdByName}
                      </p>
                      {transaction.createdByEmail ? (
                        <p className="text-muted-foreground truncate text-xs">
                          {transaction.createdByEmail}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      System
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.notes ? (
                    <p className="line-clamp-2 text-sm">{transaction.notes}</p>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No notes
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(InventoryTransactionsTable);
