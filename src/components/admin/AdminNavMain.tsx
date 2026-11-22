"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPublicAppUrl } from "@/lib/publicAppUrl";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

const overviewSubItems = [
  { title: "Intake Surveys", href: "/admin?tab=all_leads" },
  { title: "Contact Desk", href: "/admin?tab=contact_tickets" },
  { title: "Bookings & Calls", href: "/admin?tab=bookings" },
  { title: "Diagnostics", href: "/admin?tab=diagnostics" },
  { title: "Payments Feed", href: "/admin?tab=payments" },
];

const operationItems = [
  { title: "Intake leads", href: "/admin/leads", icon: FileText },
  { title: "Learners", href: "/admin/learners", icon: Users },
  { title: "Tutor bookings", href: "/admin/tutor-bookings", icon: CalendarDays },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
];

export function AdminNavMain() {
  const pathname = usePathname() || "/admin";
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Operations</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={pathname === "/admin"} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Overview" isActive={pathname === "/admin"}>
                  <LayoutDashboard aria-hidden="true" />
                  <span>Overview</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {overviewSubItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <SidebarMenuSubButton asChild>
                        <Link href={subItem.href} onClick={handleNavigate}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {operationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={handleNavigate}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/admin/users")}
              tooltip="Admin users"
            >
              <Link
                href="/admin/users"
                aria-current={isActive("/admin/users") ? "page" : undefined}
                onClick={handleNavigate}
              >
                <ShieldCheck aria-hidden="true" />
                <span>Admin users</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Public Platform">
              <Link
                href={getPublicAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNavigate}
              >
                <ExternalLink aria-hidden="true" />
                <span>Public Platform</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
