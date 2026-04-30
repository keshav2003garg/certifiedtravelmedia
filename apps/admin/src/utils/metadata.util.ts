import type { AnyRouteMatch } from '@tanstack/react-router';

import type { AppRoute } from '@/router';

type Head = {
  links?: AnyRouteMatch['links'];
  scripts?: AnyRouteMatch['headScripts'];
  meta?: AnyRouteMatch['meta'];
};

type PathMap = Record<AppRoute, { title: string; description?: string }>;

export function getMetadata(path: AppRoute): Head {
  const pathMap: Partial<PathMap> = {
    // Auth routes
    '/login': {
      title: 'Login - CTM Grid Admin',
      description: 'Sign in to your CTM Grid Generator admin account',
    },
    '/forgot-password': {
      title: 'Forgot Password - CTM Grid Admin',
      description: 'Reset your CTM Grid Generator admin password',
    },
    '/reset-password': {
      title: 'Reset Password - CTM Grid Admin',
      description: 'Create a new password for your account',
    },

    // Dashboard routes
    '/dashboard': {
      title: 'Dashboard - CTM Grid Admin',
      description: 'CTM Grid Generator admin dashboard',
    },
    '/dashboard/charts': {
      title: 'Charts - CTM Grid Admin',
      description: 'Manage brochure stand chart layouts',
    },
    '/dashboard/brochure-types': {
      title: 'Brochure Types - CTM Grid Admin',
      description: 'Manage brochure type configuration',
    },
    '/dashboard/brochure': {
      title: 'Brochure - CTM Grid Admin',
      description: 'Manage brochure assets and pack-size configuration',
    },
    '/dashboard/customers': {
      title: 'Customers - CTM Grid Admin',
      description: 'Manage customer configuration',
    },
    '/dashboard/warehouses': {
      title: 'Warehouses - CTM Grid Admin',
      description: 'Manage warehouse configuration',
    },
    '/dashboard/users': {
      title: 'Users - CTM Grid Admin',
      description: 'Manage dashboard user accounts and permissions',
    },
    '/dashboard/settings': {
      title: 'Settings - CTM Grid Admin',
      description: 'Manage your profile, password, and active sessions',
    },
    '/dashboard/inventory/new-intake': {
      title: 'New Inventory Intake - CTM Grid Admin',
      description: 'Submit staff inventory intake requests for review',
    },
  };

  const metadata = pathMap[path];

  if (!metadata) {
    return {
      meta: [
        {
          title: 'CTM Grid Admin',
        },
      ],
    };
  }

  const meta: AnyRouteMatch['meta'] = [
    {
      title: metadata.title,
    },
  ];

  if (metadata.description) {
    meta.push({
      name: 'description',
      content: metadata.description,
    });
  }

  return { meta };
}
