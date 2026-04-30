import { memo } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/base/accordion';
import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { ExternalLink, MapPin } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatCount } from '@repo/utils/number';

import type { Location, SectorWithLocations } from '@/hooks/useLocations/types';

interface LocationsSectorListProps {
  sectors: SectorWithLocations[];
}

function formatAddress(location: Location) {
  return [location.city, location.state].filter(Boolean).join(', ');
}

function LocationCard({ location }: { location: Location }) {
  return (
    <div className="bg-background grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{location.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {location.address}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>
            {formatAddress(location)} {location.zip}
          </span>
          <span className="font-mono">
            {location.pockets.width} x {location.pockets.height}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-self-start md:justify-self-end"
        asChild
      >
        <a href={location.chartUrl} target="_blank" rel="noopener noreferrer">
          Open
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
    </div>
  );
}

function LocationsSectorList({ sectors }: LocationsSectorListProps) {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {sectors.map((sector) => (
        <AccordionItem
          key={sector.id}
          value={sector.id}
          className="bg-card overflow-hidden rounded-md border shadow-sm"
        >
          <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted text-muted-foreground hidden size-10 shrink-0 items-center justify-center rounded-md sm:flex">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-normal">
                    {sector.description}
                  </p>
                  <p className="text-muted-foreground text-sm font-normal">
                    ID: {sector.acumaticaId}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'w-fit shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
                  sector.locationCount > 0
                    ? 'bg-sky-50 text-sky-700'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {formatCount(sector.locationCount)} locations
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pt-0 pb-5">
            {sector.locations.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-5 text-sm">
                No locations are currently assigned to this sector.
              </div>
            ) : (
              <div className="space-y-2">
                {sector.locations.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default memo(LocationsSectorList);
