import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useLoaderData } from '@tanstack/react-router';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/base/tabs';

import { useSession } from '@/hooks/useSession';

import AccountProfileCard from './components/account-profile-card';
import ChangePasswordCard from './components/change-password-card';
import SessionsPanel from './components/sessions-panel';
import SettingsOverviewCards from './components/settings-overview-cards';

import type { SettingsSession } from './components/sessions-panel';

function SettingsPage() {
  const { user, session } = useLoaderData({ from: '/dashboard' });
  const {
    getAllSessionsQueryOptions,
    revokeAllSessionsMutation,
    revokeSessionMutation,
  } = useSession();
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const {
    data: sessionsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery(getAllSessionsQueryOptions);

  const sessions = (sessionsData ?? []) as SettingsSession[];

  const handleRevokeSession = useCallback(
    (token: string) => {
      setRevokingToken(token);
      revokeSessionMutation.mutate(token, {
        onSettled: () => setRevokingToken(null),
      });
    },
    [revokeSessionMutation],
  );

  const handleRevokeAllSessions = useCallback(() => {
    revokeAllSessionsMutation.mutate();
  }, [revokeAllSessionsMutation]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-normal">
          Settings
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Manage your profile, password, and active sessions.
        </p>
      </div>

      <SettingsOverviewCards
        user={user}
        sessions={sessions}
        sessionsLoading={isLoading}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <AccountProfileCard user={user} />
        </TabsContent>
        <TabsContent value="security" className="mt-0">
          <ChangePasswordCard />
        </TabsContent>
        <TabsContent value="sessions" className="mt-0">
          <SessionsPanel
            sessions={sessions}
            currentSessionToken={session.token}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            revokingToken={revokingToken}
            isRevokingAll={revokeAllSessionsMutation.isPending}
            onRefresh={() => refetch()}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPage;
