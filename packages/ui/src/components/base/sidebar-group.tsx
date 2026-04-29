// Node Modules
import { memo, useCallback } from 'react';

// Components
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/components/base/collapsible';
import {
  SidebarGroup as SidebarGroupBase,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@repo/ui/components/base/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';
import { ChevronRight } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { LucideIcon } from '@repo/ui/lib/icons';

export interface SidebarGroupProps {
  title: string;
  currentPath?: string;
  LinkComponent: React.ComponentType<{
    to: string;
    className?: string;
    children: React.ReactNode;
  }>;
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}

function SidebarGroup(props: SidebarGroupProps) {
  const { title, items, currentPath = '/', LinkComponent } = props;

  const { state } = useSidebar();

  const isActive = useCallback(
    (url: string, hasChildren: boolean = false) => {
      if (currentPath === url) {
        return true;
      }

      if (hasChildren) {
        return currentPath.startsWith(url + '/');
      }

      return false;
    },
    [currentPath],
  );

  if (state === 'collapsed') {
    return (
      <SidebarGroupBase>
        <SidebarMenu className="items-center space-y-0.5">
          {items.map((item) => {
            const active = isActive(item.url, !!item.items);
            return (
              <SidebarMenuItem key={item.title} className="items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <LinkComponent
                          to={item.url}
                          className={cn(
                            'flex items-center justify-center rounded-lg transition-all duration-200',
                            active
                              ? 'bg-sidebar-primary/15 text-sidebar-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                          )}
                        >
                          <item.icon className="size-4" />
                        </LinkComponent>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-albert text-sm">{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupBase>
    );
  }

  return (
    <SidebarGroupBase>
      <SidebarGroupLabel className="font-inter text-sidebar-foreground/70 mb-1 px-3 text-xs font-bold tracking-widest uppercase">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-0.5 px-3">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={
              isActive(item.url, !!item.items) ||
              (item.items?.some((sub) => isActive(sub.url)) ?? false)
            }
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild={!item.items}
                  size="default"
                  className={cn(
                    'font-albert group h-11 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive(item.url)
                      ? 'bg-sidebar-primary/15 text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  )}
                >
                  {item.items ? (
                    <>
                      {item.icon && (
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300',
                            isActive(item.url, !!item.items)
                              ? 'bg-sidebar-primary/20 text-sidebar-primary'
                              : 'bg-sidebar-accent/40 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/60 group-hover:text-sidebar-foreground',
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                      )}
                      <span className="flex-1 text-left font-medium">
                        {item.title}
                      </span>
                      <ChevronRight className="text-sidebar-foreground/50 ml-auto h-3.5 w-3.5 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                    </>
                  ) : (
                    <LinkComponent
                      to={item.url}
                      className="flex w-full items-center gap-3"
                    >
                      {item.icon && (
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300',
                            isActive(item.url, !!item.items)
                              ? 'bg-sidebar-primary/20 text-sidebar-primary'
                              : 'bg-sidebar-accent/40 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/60 group-hover:text-sidebar-foreground',
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                      )}
                      <span className="flex-1 text-left font-medium">
                        {item.title}
                      </span>
                    </LinkComponent>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub className="border-sidebar-border/50 mt-2 ml-6 space-y-1 border-l">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className="text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground h-9 rounded-lg font-medium transition-all duration-300"
                        >
                          <LinkComponent
                            to={subItem.url}
                            className="flex w-full items-center gap-2"
                          >
                            <span className="font-albert text-sm">
                              {subItem.title}
                            </span>
                          </LinkComponent>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroupBase>
  );
}

export default memo(SidebarGroup);
