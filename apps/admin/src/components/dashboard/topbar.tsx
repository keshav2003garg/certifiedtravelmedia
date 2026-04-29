import { Fragment, memo } from 'react';

import { Link, useLoaderData, useLocation } from '@tanstack/react-router';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/base/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/ui/components/base/breadcrumb';
import { Button } from '@repo/ui/components/base/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
import { Separator } from '@repo/ui/components/base/separator';
import { SidebarTrigger } from '@repo/ui/components/base/sidebar';
import { LogOut } from '@repo/ui/lib/icons';

import { useAuth } from '@/hooks/useAuth';

import { accountItems, navigationItems } from './sidebar';

interface BreadcrumbItemType {
  title: string;
  url?: string;
  isActive: boolean;
}

function normalizePathname(pathname: string) {
  if (pathname.length <= 1) return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

function formatSegmentTitle(segment: string) {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getInitials(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) return 'A';

  const firstInitial = parts[0]?.charAt(0) ?? '';
  const secondInitial =
    parts.length > 1
      ? (parts[parts.length - 1]?.charAt(0) ?? '')
      : (parts[0]?.charAt(1) ?? '');

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function buildBreadcrumbs(pathname: string): BreadcrumbItemType[] {
  const normalizedPathname = normalizePathname(pathname);
  const topLevelItems = [...navigationItems, ...accountItems];

  const breadcrumbs: BreadcrumbItemType[] = [
    { title: 'Admin', url: '/dashboard', isActive: false },
  ];

  if (normalizedPathname === '/dashboard') {
    breadcrumbs.push({ title: 'Charts', isActive: true });
    return breadcrumbs;
  }

  for (const item of topLevelItems) {
    const childItem = item.items?.find(
      (child) => child.url === normalizedPathname,
    );

    if (childItem) {
      if (item.url !== childItem.url) {
        breadcrumbs.push({ title: item.title, url: item.url, isActive: false });
      }

      breadcrumbs.push({ title: childItem.title, isActive: true });
      return breadcrumbs;
    }

    if (normalizedPathname === item.url) {
      breadcrumbs.push({ title: item.title, isActive: true });
      return breadcrumbs;
    }
  }

  const segments = normalizedPathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (lastSegment) {
    const formattedTitle = formatSegmentTitle(lastSegment);
    breadcrumbs.push({ title: formattedTitle, isActive: true });
  }

  return breadcrumbs;
}

function ProfileDropdown() {
  const { logoutMutation } = useAuth();
  const { user } = useLoaderData({ from: '/dashboard' });
  const displayName = user.name?.trim() || 'Admin';
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
          aria-label="Open account menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuItem
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar() {
  const { pathname } = useLocation();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header className="bg-sidebar border-sidebar-border sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${crumb.title}-${index}`}>
              <BreadcrumbItem
                className={index === 0 ? 'hidden md:block' : undefined}
              >
                {crumb.isActive || !crumb.url ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.url}>{crumb.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator
                  className={index === 0 ? 'hidden md:block' : undefined}
                />
              )}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto">
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default memo(TopBar);
