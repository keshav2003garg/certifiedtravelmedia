import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { CheckCircle2, Monitor, Shield } from '@repo/ui/lib/icons';

import type { SettingsUser } from './account-profile-card';
import type { SettingsSession } from './sessions-panel';

interface SettingsOverviewCardsProps {
  user: SettingsUser;
  sessions: SettingsSession[];
  sessionsLoading: boolean;
}

function formatRole(role: string | null | undefined) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
}

function SettingsOverviewCards({
  user,
  sessions,
  sessionsLoading,
}: SettingsOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-none">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Role</p>
            <p className="truncate font-semibold">{formatRole(user.role)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Email</p>
            <Badge variant={user.emailVerified ? 'secondary' : 'outline'}>
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
            <Monitor className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Active sessions</p>
            <p className="font-semibold">
              {sessionsLoading ? 'Loading' : sessions.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(SettingsOverviewCards);
