import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import { ExternalLink } from '@repo/ui/lib/icons';

import type { Location } from '@/hooks/useLocations/types';

interface LocationsTableProps {
  locations: Location[];
}

function formatAddress(location: Location) {
  return [location.city, location.state].filter(Boolean).join(', ');
}

function LocationSectorBadges({ location }: { location: Location }) {
  const visibleSectors = location.sectors.slice(0, 2);
  const hiddenSectorCount = Math.max(location.sectors.length - 2, 0);

  if (location.sectors.length === 0) {
    return <span className="text-muted-foreground text-sm">Unassigned</span>;
  }

  return (
    <div className="flex max-w-sm flex-wrap gap-1.5">
      {visibleSectors.map((sector) => (
        <Badge key={sector.id} variant="secondary" className="rounded-md">
          {sector.acumaticaId ? `${sector.acumaticaId}` : null}
        </Badge>
      ))}
      {hiddenSectorCount > 0 ? (
        <Badge variant="outline" className="rounded-md">
          +{hiddenSectorCount}
        </Badge>
      ) : null}
    </div>
  );
}

function LocationsTable({ locations }: LocationsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-52 font-semibold">Location</TableHead>
            <TableHead className="hidden min-w-72 font-semibold md:table-cell">
              Address
            </TableHead>
            <TableHead className="hidden min-w-64 font-semibold lg:table-cell">
              Sectors
            </TableHead>
            <TableHead className="font-semibold">Grid</TableHead>
            <TableHead className="text-right font-semibold">Chart</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="leading-none font-medium">{location.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {location.locationId ?? location.airtableId ?? location.id}
                  </p>
                  <p className="text-muted-foreground text-xs md:hidden">
                    {formatAddress(location)} {location.zip}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="max-w-md space-y-1">
                  <p className="truncate text-sm">{location.address}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatAddress(location)} {location.zip}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <LocationSectorBadges location={location} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-md font-mono">
                  {location.pockets.width} x {location.pockets.height}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="ghost" size="sm" asChild>
                  <a
                    href={location.chartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default memo(LocationsTable);
