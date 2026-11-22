import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarProvider";
import AdminLearners from "./AdminLearnersClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/learners",
}));

vi.mock("@/app/actions/admin", () => ({
  deleteAdminLearner: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("AdminLearners Portal Component", () => {
  const baseProps = {
    rows: [],
    total: 2,
    page: 1,
    pageSize: 25,
    search: "",
    language: "all",
    metrics: { totalRegistered: 2, french: 2, germanSpanish: 0, chineseArabic: 0 },
    pagination: null,
  };

  it("renders Registered learners header and metric cards", () => {
    render(
      <AdminSidebarProvider>
        <AdminLearners {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByRole("heading", { name: "Registered learners" })).toBeInTheDocument();
    expect(screen.getByText("Total Registered")).toBeInTheDocument();
    expect(screen.getByText("French Learners")).toBeInTheDocument();
  });

  it("renders search input and CSV export button", () => {
    render(
      <AdminSidebarProvider>
        <AdminLearners {...baseProps} />
      </AdminSidebarProvider>
    );

    expect(screen.getByPlaceholderText(/Search by learner name/i)).toBeInTheDocument();
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
  });
});
