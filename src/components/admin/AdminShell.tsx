"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";

interface AdminShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  actionLayout?: "single" | "two" | "three";
  children: ReactNode;
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  const pathname = usePathname() || "/admin";
  const isOverview = pathname === "/admin";

  return (
    <>
      <AdminAppSidebar />

      <SidebarInset className="min-w-0 bg-background md:bg-card md:border md:border-border/70">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-card/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:rounded-t-xl">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger
              className="-ml-1 size-8"
              aria-label="Toggle admin navigation"
            />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  {isOverview ? (
                    <span className="text-muted-foreground">Interglott Admin</span>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href="/admin">Interglott Admin</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1520px] min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>

          {children}
        </div>
      </SidebarInset>
    </>
  );
}
