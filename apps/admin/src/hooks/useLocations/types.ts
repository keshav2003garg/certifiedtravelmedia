import type { ApiData } from '@/lib/api/types';

export interface Sector {
  id: string;
  acumaticaId: string;
  description: string;
}

export type LocationSortBy =
  | 'name'
  | 'locationId'
  | 'city'
  | 'state'
  | 'pocketSize';
export type SectorSortBy = 'acumaticaId' | 'description' | 'locationCount';
export type SortOrder = 'asc' | 'desc';

export interface Location {
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
  sectors: Sector[];
  sectorCount: number;
  chartUrl: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SectorWithLocations {
  id: string;
  acumaticaId: string;
  description: string;
  locations: Location[];
  locationCount: number;
}

export interface Stats {
  totalLocations: number;
  totalSectors: number;
  assignedLocations: number;
  unassignedLocations: number;
  defaultPocketLocations: number;
}

export type GetLocationStatsRequest = ApiData<void, { stats: Stats }>;

export type GetLocationsRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sectorId?: string;
    width?: number;
    height?: number;
    isDefaultPockets?: boolean;
    sortBy?: LocationSortBy;
    order?: SortOrder;
  },
  { locations: Location[]; pagination: Pagination }
>;

export type GetLocationsBySectorRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sectorId?: string;
    width?: number;
    height?: number;
    isDefaultPockets?: boolean;
    sortBy?: SectorSortBy;
    order?: SortOrder;
  },
  { sectors: SectorWithLocations[]; pagination: Pagination }
>;

export type GetLocationRequest = ApiData<
  { id: string },
  { location: Location }
>;
