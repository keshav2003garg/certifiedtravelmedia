import type { AnyRouteMatch } from '@tanstack/react-router';

import type { AppRoute } from '@/router';

type Head = {
  links?: AnyRouteMatch['links'];
  scripts?: AnyRouteMatch['headScripts'];
  meta?: AnyRouteMatch['meta'];
};

type PathMap = Record<AppRoute, { title: string; description?: string }>;

export function getMetadata(path: AppRoute): Head {
  const pathMap: Partial<PathMap> = {};

  const metadata = pathMap[path];

  if (!metadata) {
    return {
      meta: [
        {
          title: 'CTM Grid',
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
