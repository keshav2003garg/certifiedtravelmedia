export enum ReactQueryKeys {
  // Sessions
  GET_SESSIONS = 'GET::/auth.listSessions()',

  // Configs
  GET_BROCHURE_TYPES = 'GET::/admin/configs/brochure-types',
  GET_BROCHURE_TYPE = 'GET::/admin/configs/brochure-types/:id',
  GET_CUSTOMERS = 'GET::/admin/configs/customers',
  GET_CUSTOMER = 'GET::/admin/configs/customers/:id',
}
