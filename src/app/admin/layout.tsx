import type { ReactNode } from "react";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminSidebarProvider>{children}</AdminSidebarProvider>;
}
