import type { z } from '@repo/utils/zod';
import type {
  getLocationsBySectorValidator,
  getLocationsValidator,
} from './locations.validators';

export type ListLocationsParams = z.infer<typeof getLocationsValidator.query>;
export type ListLocationsBySectorParams = z.infer<
  typeof getLocationsBySectorValidator.query
>;

export interface LocationWithChart {
  id: string;
  locationId: string | null;
  airtableId: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  pockets: { width: number; height: number };
  isDefaultPockets: boolean;
  route4MeId: string | null;
  sectors: { id: string; acumaticaId: string; description: string }[];
  sectorCount: number;
  chartUrl: string;
}

export interface SectorWithLocations {
  id: string;
  acumaticaId: string;
  description: string;
  locations: LocationWithChart[];
  locationCount: number;
}
