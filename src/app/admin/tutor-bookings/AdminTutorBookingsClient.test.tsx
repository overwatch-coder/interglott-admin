import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarProvider";
import AdminTutorBookings from "./AdminTutorBookingsClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/tutor-bookings",
}));

vi.mock("@/app/actions/admin", () => ({
  updateAdminTutorBooking: vi.fn().mockResolvedValue({ ok: true }),
  deleteAdminTutorBooking: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("AdminTutorBookings Control Hub Component", () => {
  const baseProps = {
    rows: [],
    total: 1,
    page: 1,
    pageSize: 25,
    search: "",
    language: "all",
    status: "all",
    metrics: { totalBookings: 1, pending: 1, inProgress: 0, completed: 0 },
    pagination: null,
  };

  it("renders Tutor bookings header and metric cards", () => {
    render(
      <AdminSidebarProvider>
        <AdminTutorBookings {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByRole("heading", { name: "Tutor bookings" })).toBeInTheDocument();
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
  });

  it("renders search bar and export CSV button", () => {
    render(
      <AdminSidebarProvider>
        <AdminTutorBookings {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByPlaceholderText(/Search by student name/i)).toBeInTheDocument();
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
  });
});
