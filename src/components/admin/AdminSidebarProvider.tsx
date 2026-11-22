"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen className="admin-workspace">
      {children}
    </SidebarProvider>
  );
}
