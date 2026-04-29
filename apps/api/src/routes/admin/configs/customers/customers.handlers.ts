import sendResponse from '@repo/server-utils/utils/response';

import { customersService } from './customers.services';

import type {
  CreateCustomerContext,
  CustomerIdContext,
  DeleteCustomerContext,
  ListCustomersContext,
  UpdateCustomerContext,
} from './customers.validators';

export async function listCustomersHandler(ctx: ListCustomersContext) {
  const params = ctx.req.valid('query');

  const result = await customersService.list(params);

  return sendResponse(ctx, 200, 'Customers retrieved successfully', {
    customers: result.data,
    pagination: result.pagination,
  });
}

export async function getCustomerHandler(ctx: CustomerIdContext) {
  const { id } = ctx.req.valid('param');

  const customer = await customersService.getById(id);

  return sendResponse(ctx, 200, 'Customer retrieved successfully', {
    customer,
  });
}

export async function createCustomerHandler(ctx: CreateCustomerContext) {
  const body = ctx.req.valid('json');

  const customer = await customersService.create(body);

  return sendResponse(ctx, 201, 'Customer created successfully', {
    customer,
  });
}

export async function updateCustomerHandler(ctx: UpdateCustomerContext) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const customer = await customersService.update(id, body);

  return sendResponse(ctx, 200, 'Customer updated successfully', {
    customer,
  });
}

export async function deleteCustomerHandler(ctx: DeleteCustomerContext) {
  const { id } = ctx.req.valid('param');

  const customer = await customersService.delete(id);

  return sendResponse(ctx, 200, 'Customer deleted successfully', {
    customer,
  });
}
