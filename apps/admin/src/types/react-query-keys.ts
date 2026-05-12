export enum ReactQueryKeys {
  // Sessions
  GET_SESSIONS = 'GET::/auth.listSessions()',
  GET_USERS = 'GET::/auth.admin.listUsers()',

  // Configs
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

  // Charts
  GET_CHART_SECTORS = 'GET::/admin/charts/sectors',
  GET_SECTOR_CHART = 'GET::/admin/charts/sectors/:sectorId',
  GET_CHART_CUSTOM_FILLERS = 'GET::/admin/charts/custom-fillers',

  // Inventory
  GET_INVENTORY_ITEMS = 'GET::/admin/inventory/items',
  GET_INVENTORY_ITEM = 'GET::/admin/inventory/items/:id',
  GET_INVENTORY_BROCHURES = 'GET::/admin/inventory/brochures',
  GET_INVENTORY_BROCHURE = 'GET::/admin/inventory/brochures/:id',
  GET_INVENTORY_ITEM_TRANSACTIONS = 'GET::/admin/inventory/items/:id/transactions',
  GET_INVENTORY_MONTH_END_COUNTS = 'GET::/admin/inventory/counts',
  GET_INVENTORY_SUBMITTED_MONTH_END_COUNTS = 'GET::/admin/inventory/counts/submitted',
  GET_SCAN_INVENTORY_RESOLVE = 'GET::/admin/inventory/counts/scan/:id/resolve',
  GET_SCAN_INVENTORY_ITEM = 'GET::/admin/inventory/counts/scan/:id',
  GET_INVENTORY_REQUESTS = 'GET::/admin/inventory/requests',
  GET_INVENTORY_REQUEST = 'GET::/admin/inventory/requests/:id',
  GET_INVENTORY_REQUEST_STATS = 'GET::/admin/inventory/requests/stats',
}
