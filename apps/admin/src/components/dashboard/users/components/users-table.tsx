import { memo } from 'react';

import { useLoaderData } from '@tanstack/react-router';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import {
  Ban,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { UserWithRole } from '@/hooks/useUsers/types';

interface UsersTableProps {
  users: UserWithRole[];
  actionUserId: string | null;
  onEdit: (user: UserWithRole) => void;
  onBan: (user: UserWithRole) => void;
  onUnban: (user: UserWithRole) => void;
  onResetPassword: (user: UserWithRole) => void;
  onDelete: (user: UserWithRole) => void;
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  staff: 'outline',
  user: 'outline',
};

function formatRole(role: string) {
  return role
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(', ');
}

function UserStatusBadge({ user }: { user: UserWithRole }) {
  if (user.banned) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Banned
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Active
    </Badge>
  );
}

function UsersTable({
  users,
  actionUserId,
  onEdit,
  onBan,
  onUnban,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const { user: currentUser } = useLoaderData({ from: '/dashboard' });

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ minWidth: '980px' }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[28%]">Name</TableHead>
              <TableHead className="w-[32%]">Email</TableHead>
              <TableHead className="w-[16%]">Role</TableHead>
              <TableHead className="w-[16%]">Status</TableHead>
              <TableHead className="w-[8%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUser.id;
              const isPending = actionUserId === user.id;
              const isBanned = Boolean(user.banned);

              return (
                <TableRow
                  key={user.id}
                  className={cn(isPending && 'pointer-events-none opacity-60')}
                >
                  <TableCell>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">
                        {user.name || 'Unnamed user'}
                        {isSelf ? (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      {!user.emailVerified ? (
                        <p className="text-muted-foreground text-xs">
                          Email not verified
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground block truncate">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={roleBadgeVariant[user.role] ?? 'outline'}
                      className="rounded-md"
                    >
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge user={user} />
                    {isBanned && user.banReason ? (
                      <p className="text-muted-foreground mt-1 max-w-36 truncate text-xs">
                        {user.banReason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSelf ? (
                      <span className="text-muted-foreground text-xs">-</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Open actions for ${user.name || user.email}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onResetPassword(user)}
                          >
                            <KeyRound className="size-4" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isBanned ? (
                            <DropdownMenuItem onClick={() => onUnban(user)}>
                              <ShieldCheck className="size-4" />
                              Unban
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => onBan(user)}
                              className="text-amber-600 focus:text-amber-600"
                            >
                              <Ban className="size-4" />
                              Ban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onDelete(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default memo(UsersTable);
