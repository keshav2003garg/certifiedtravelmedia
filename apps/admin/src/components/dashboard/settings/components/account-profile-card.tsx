import { memo } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/base/avatar';
import { Badge } from '@repo/ui/components/base/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Calendar, Mail, Shield, User } from '@repo/ui/lib/icons';

import { formatDate } from '@/utils/date.utils';

export interface SettingsUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  createdAt?: string | Date | null;
}

function getInitials(name: string | null | undefined, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role: string | null | undefined) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
}

interface AccountProfileCardProps {
  user: SettingsUser;
}

function AccountProfileCard({ user }: AccountProfileCardProps) {
  const displayName = user.name?.trim() || 'Unnamed user';
  const joinedDate = user.createdAt ? formatDate(user.createdAt) : 'Unknown';

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Account identity and dashboard access details.
            </CardDescription>
          </div>
          <Badge variant={user.emailVerified ? 'secondary' : 'outline'}>
            {user.emailVerified ? 'Verified email' : 'Email not verified'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20 rounded-md">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground rounded-md text-xl font-semibold">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-normal">
              {displayName}
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-sm">
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <User className="size-4" />
              Name
            </p>
            <p className="mt-1 truncate font-medium">{displayName}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Mail className="size-4" />
              Email
            </p>
            <p className="mt-1 truncate font-medium">{user.email}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Shield className="size-4" />
              Role
            </p>
            <p className="mt-1 font-medium">{formatRole(user.role)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="size-4" />
              Joined
            </p>
            <p className="mt-1 font-medium">{joinedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(AccountProfileCard);