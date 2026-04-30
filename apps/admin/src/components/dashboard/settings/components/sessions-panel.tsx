import { memo } from 'react';

import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import {
  AlertCircle,
  Clock,
  Globe,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import { formatDate } from '@/utils/date.utils';
import { getDeviceIcon, getDeviceName } from '@/utils/session.utils';

export interface SettingsSession {
  id: string;
  token?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  expiresAt?: string | Date | null;
}

interface SessionsPanelProps {
  sessions: SettingsSession[];
  currentSessionToken?: string | null;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  revokingToken: string | null;
  isRevokingAll: boolean;
  onRefresh: () => void;
  onRevokeSession: (token: string) => void;
  onRevokeAllSessions: () => void;
}

function SessionsPanelSkeleton() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SessionsPanel({
  sessions,
  currentSessionToken,
  isLoading,
  isError,
  isFetching,
  revokingToken,
  isRevokingAll,
  onRefresh,
  onRevokeSession,
  onRevokeAllSessions,
}: SessionsPanelProps) {
  if (isLoading) return <SessionsPanelSkeleton />;

  const otherSessions = sessions.filter(
    (session) => session.token !== currentSessionToken,
  );

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              Sessions
            </CardTitle>
            <CardDescription>
              Review signed-in devices and revoke sessions you do not need.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
            {otherSessions.length > 0 ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRevokeAllSessions}
                disabled={isRevokingAll}
              >
                {isRevokingAll ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sign out others
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Active sessions could not be loaded.
            </AlertDescription>
          </Alert>
        ) : null}

        {sessions.length === 0 && !isError ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="bg-muted text-muted-foreground mb-3 flex size-11 items-center justify-center rounded-md">
              <Globe className="size-5" />
            </div>
            <h2 className="text-base font-semibold tracking-normal">
              No active sessions
            </h2>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Session activity will appear here after sign-in.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <div className="divide-y">
              {sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.userAgent ?? null);
                const isCurrentSession =
                  session.token === currentSessionToken && Boolean(session.token);
                const token = session.token ?? '';
                const isRevoking = token.length > 0 && revokingToken === token;

                return (
                  <div
                    key={session.id}
                    className={cn(
                      'grid gap-4 p-4 transition-colors sm:grid-cols-[1fr_auto] sm:items-center',
                      isCurrentSession ? 'bg-primary/5' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-md',
                          isCurrentSession
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <DeviceIcon className="size-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {getDeviceName(session.userAgent ?? null)}
                          </p>
                          {isCurrentSession ? (
                            <Badge variant="secondary">Current</Badge>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {formatDate(session.createdAt)}
                          </span>
                          {session.ipAddress ? <span>{session.ipAddress}</span> : null}
                          {session.expiresAt ? (
                            <span>Expires {formatDate(session.expiresAt)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {isCurrentSession ? (
                      <span className="text-muted-foreground text-sm sm:text-right">
                        This device
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive sm:justify-self-end"
                        onClick={() => token && onRevokeSession(token)}
                        disabled={!token || isRevoking || isRevokingAll}
                      >
                        {isRevoking ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Revoke
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { SessionsPanelSkeleton };
export default memo(SessionsPanel);