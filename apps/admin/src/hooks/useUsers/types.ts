export const USER_ROLES = ['staff', 'manager', 'admin'] as const;
export const USER_SEARCH_FIELDS = ['email', 'name'] as const;
export const USER_SORT_OPTIONS = [
  'name',
  'email',
  'role',
  'createdAt',
  'updatedAt',
] as const;
export const SORT_ORDER_OPTIONS = ['asc', 'desc'] as const;
export const USER_FILTER_OPTIONS = [
  'role:staff',
  'role:manager',
  'role:admin',
  'status:active',
  'status:banned',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserSearchField = (typeof USER_SEARCH_FIELDS)[number];
export type UserSortBy = (typeof USER_SORT_OPTIONS)[number];
export type SortOrder = (typeof SORT_ORDER_OPTIONS)[number];
export type UserFilter = (typeof USER_FILTER_OPTIONS)[number];

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: UserRole | 'user' | (string & {});
  image?: string | null;
  emailVerified: boolean;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | Date | number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: UserSearchField;
  sortBy?: UserSortBy;
  order?: SortOrder;
  filter?: UserFilter;
}

export interface ListUsersResponse {
  users: UserWithRole[];
  pagination: Pagination;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  userId: string;
  data: Partial<Pick<CreateUserPayload, 'name'>>;
}

export interface SetRolePayload {
  userId: string;
  role: UserRole;
}

export interface BanUserPayload {
  userId: string;
  banReason?: string;
  banExpiresIn?: number;
}

export interface ResetPasswordPayload {
  userId: string;
  newPassword: string;
}

export interface RemoveUserPayload {
  userId: string;
}
