import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarProvider";
import Admin from "./AdminOverviewClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin",
}));

vi.mock("@/app/actions/admin", () => ({
  updateAdminLead: vi.fn().mockResolvedValue({ ok: true }),
  deleteAdminLead: vi.fn().mockResolvedValue({ ok: true }),
  deleteAdminContactTicket: vi.fn().mockResolvedValue({ ok: true }),
  deleteAdminPayment: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/app/actions/adminNotifications", () => ({
  sendAdminNotification: vi.fn().mockResolvedValue({ emailSent: false, recorded: true }),
}));

describe("Admin Operations Overview", () => {
  const baseProps = {
    tab: "all_leads" as const,
    rows: [],
    counts: {
      all_leads: 2,
      contact_tickets: 6,
      bookings: 3,
      diagnostics: 1,
      users: 1,
      payments: 0,
    },
    search: "",
    status: "all",
    course: "all",
    pagination: null,
  };

  it("renders Operations overview title, sidebar trigger, and tab navigation", () => {
    render(
      <AdminSidebarProvider>
        <Admin {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByRole("heading", { name: "Operations overview" })).toBeInTheDocument();
    expect(screen.getByLabelText("Toggle admin navigation")).toBeInTheDocument();
    expect(screen.getAllByText("Intake Surveys").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contact Desk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bookings & Calls").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Diagnostics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin Users").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payments").length).toBeGreaterThan(0);
  });

  it("renders contact desk table headers when contact_tickets tab is active", () => {
    render(
      <AdminSidebarProvider>
        <Admin {...baseProps} tab="contact_tickets" />
      </AdminSidebarProvider>
    );

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Intent")).toBeInTheDocument();
    expect(screen.getByText("Category / Subject")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.queryByText("Ticket Reference")).not.toBeInTheDocument();
  });

  it("renders export CSV and refresh buttons", () => {
    render(
      <AdminSidebarProvider>
        <Admin {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByText("Export page CSV")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });
});
