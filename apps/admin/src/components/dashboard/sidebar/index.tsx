import { memo, useMemo } from 'react';

import { Link, useLocation } from '@tanstack/react-router';

import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from '@repo/ui/components/base/sidebar';
import SidebarGroup from '@repo/ui/components/base/sidebar-group';
import {
  FileText,
  LayoutGrid,
  Package,
  Settings,
  Settings2,
  Users,
} from '@repo/ui/lib/icons';

import { useUserRole } from '@/hooks/useUserRole';

import SidebarHeader from './header';

import type { SidebarGroupProps } from '@repo/ui/components/base/sidebar-group';
import type { UserRole } from '@/hooks/useUserRole';

type SidebarItem = SidebarGroupProps['items'][number] & {
  minRole?: Exclude<UserRole, 'user'>;
  allowedRoles?: UserRole[];
  items?: (NonNullable<SidebarGroupProps['items'][number]['items']>[number] & {
    minRole?: Exclude<UserRole, 'user'>;
    allowedRoles?: UserRole[];
  })[];
};

export const navigationItems: SidebarItem[] = [
  {
    title: 'Charts',
    url: '/dashboard/charts',
    icon: LayoutGrid,
  },
  {
    title: 'Inventory',
    url: '/dashboard/inventory',
    icon: Package,
    minRole: 'staff',
    items: [
      { title: 'Inventory', url: '/dashboard/inventory' },
      {
        title: 'New Inventory Intake',
        url: '/dashboard/inventory/new-intake',
        allowedRoles: ['staff'],
      },
      {
        title: 'New Inventory',
        url: '/dashboard/inventory/new',
        allowedRoles: ['manager', 'admin'],
      },
      {
        title: 'Month End Counts',
        url: '/dashboard/inventory/month-end-counts',
      },
    ],
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: FileText,
    minRole: 'manager',
  },
  {
    title: 'Config',
    url: '/dashboard/warehouses',
    icon: Settings2,
    minRole: 'manager',
    items: [
      { title: 'Brochure', url: '/dashboard/Brochure' },
      { title: 'Customers', url: '/dashboard/customers' },
      { title: 'Warehouses', url: '/dashboard/warehouses' },
      { title: 'Brochure Types', url: '/dashboard/brochure-types' },
    ],
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: Users,
    minRole: 'admin',
  },
];

export const accountItems: SidebarGroupProps['items'] = [
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

function AppSidebar() {
  const { pathname } = useLocation();
  const { role, isStaff, isManager, isAdmin } = useUserRole();
  const { isMobile, setOpenMobile } = useSidebar();

  const filteredNavItems = useMemo(() => {
    const hasAccess = (item: Pick<SidebarItem, 'minRole' | 'allowedRoles'>) => {
      if (item.allowedRoles) {
        return item.allowedRoles.includes(role);
      }

      const minRole = item.minRole ?? 'staff';
      if (minRole === 'admin') return isAdmin;
      if (minRole === 'manager') return isManager;
      return isStaff;
    };

    return navigationItems.reduce<SidebarItem[]>((items, item) => {
      if (!hasAccess(item)) return items;

      items.push({
        ...item,
        items: item.items?.filter(hasAccess),
      });

      return items;
    }, []);
  }, [role, isStaff, isManager, isAdmin]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border bg-sidebar border-r"
    >
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup
          title="Navigation"
          items={filteredNavItems}
          currentPath={pathname}
          LinkComponent={({ to, children, className }) => (
            <Link
              to={to}
              className={className}
              onClick={() => isMobile && setOpenMobile(false)}
            >
              {children}
            </Link>
          )}
        />
        <SidebarGroup
          title="Account"
          items={accountItems}
          currentPath={pathname}
          LinkComponent={({ to, children, className }) => (
            <Link
              to={to}
              className={className}
              onClick={() => isMobile && setOpenMobile(false)}
            >
              {children}
            </Link>
          )}
        />
      </SidebarContent>
    </Sidebar>
  );
}

export default memo(AppSidebar);
