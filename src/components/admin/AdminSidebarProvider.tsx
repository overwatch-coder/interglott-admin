"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminAppSidebar } from "@/components/admin/AdminAppSidebar";

const AdminPersistentShellContext = createContext<boolean>(false);

export function useIsInsideAdminPersistentShell(): boolean {
  return useContext(AdminPersistentShellContext);
}

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginRoute) {
    return (
      <SidebarProvider defaultOpen className="admin-workspace">
        {children}
      </SidebarProvider>
    );
  }

  return (
    <AdminPersistentShellContext.Provider value={true}>
      <SidebarProvider defaultOpen className="admin-workspace">
        <AdminAppSidebar />
        <SidebarInset className="min-w-0 bg-background md:bg-card md:border md:border-border/70">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AdminPersistentShellContext.Provider>
  );
}
