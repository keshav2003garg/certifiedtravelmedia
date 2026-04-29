import { memo } from 'react';

import {
  SidebarHeader as SidebarHeaderBase,
  useSidebar,
} from '@repo/ui/components/base/sidebar';

function LogoMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={
        collapsed
          ? 'ring-blue/20 relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5 shadow-sm ring-1'
          : 'flex size-10 shrink-0 items-center justify-center'
      }
    >
      <img
        src="/favicon.png"
        alt="CTM Grid logo"
        width={collapsed ? 28 : 40}
        height={collapsed ? 28 : 40}
        className="object-contain"
      />
    </div>
  );
}

function SidebarHeader() {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return (
      <SidebarHeaderBase className="border-sidebar-border bg-sidebar/50 h-16 border-b">
        <div className="flex size-full items-center justify-center p-3">
          <LogoMark collapsed />
        </div>
      </SidebarHeaderBase>
    );
  }

  return (
    <SidebarHeaderBase className="border-sidebar-border bg-sidebar/50 h-16 border-b">
      <div className="flex items-center gap-3 px-3">
        <LogoMark />

        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sidebar-foreground text-base font-bold tracking-tight">
              CTM Grid
            </span>
          </div>
          <span className="text-sidebar-foreground/60 text-xs font-medium">
            Admin Dashboard
          </span>
        </div>
      </div>
    </SidebarHeaderBase>
  );
}

export default memo(SidebarHeader);
