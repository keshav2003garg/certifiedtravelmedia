export enum ReactQueryKeys {
  // Sessions
  GET_SESSIONS = 'GET::/auth.listSessions()',
  GET_USERS = 'GET::/auth.admin.listUsers()',

  // Configs
  GET_BROCHURES = 'GET::/admin/configs/brochures',
  GET_BROCHURE = 'GET::/admin/configs/brochures/:id',
  GET_BROCHURE_TYPES = 'GET::/admin/configs/brochure-types',
  GET_BROCHURE_TYPE = 'GET::/admin/configs/brochure-types/:id',
  GET_CUSTOMERS = 'GET::/admin/configs/customers',
  GET_CUSTOMER = 'GET::/admin/configs/customers/:id',
  GET_WAREHOUSES = 'GET::/admin/configs/warehouses',
  GET_WAREHOUSE = 'GET::/admin/configs/warehouses/:id',
  GET_WAREHOUSE_SECTORS = 'GET::/admin/configs/warehouses/sectors',

  // Locations
  GET_LOCATION_STATS = 'GET::/admin/locations/stats',
  GET_LOCATIONS = 'GET::/admin/locations',
  GET_LOCATIONS_BY_SECTOR = 'GET::/admin/locations/by-sector',
  GET_LOCATION = 'GET::/admin/locations/:id',
}
