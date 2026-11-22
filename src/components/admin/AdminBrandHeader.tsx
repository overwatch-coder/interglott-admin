"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronsUpDown, ExternalLink, LayoutDashboard } from "lucide-react";
import { getPublicDashboardUrl } from "@/lib/publicAppUrl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AdminBrandHeader() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Interglott Admin"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-white shadow-2xs">
                <Image
                  src="/interglott-logo.png"
                  alt="Interglott"
                  width={24}
                  height={24}
                  priority
                  className="size-6 object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-display font-semibold tracking-tight">Interglott</span>
                <span className="truncate text-xs text-muted-foreground">Admin Console</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/admin" onClick={() => setOpenMobile(false)}>
                <div className="flex size-6 items-center justify-center rounded-sm border bg-primary text-primary-foreground">
                  <LayoutDashboard className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin Console</span>
                  <span className="text-[11px] text-muted-foreground">Operations & reviews</span>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link
                href={getPublicDashboardUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenMobile(false)}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Learner Platform</span>
                  <span className="text-[11px] text-muted-foreground">Open learner dashboard</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
