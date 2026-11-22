"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDeleteDialog } from "@/components/admin/AdminDeleteDialog";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";
import { deleteAdminTutorBooking, updateAdminTutorBooking } from "@/app/actions/admin";
import {
  Users,
  Search,
  Download,
  Eye,
  X,
  Mail,
  Phone,
  Globe,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export interface TutorBookingRecord {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  country_of_residence?: string;
  timezone?: string;
  language_to_learn: string;
  specific_tutor?: string;
  session_format?: string;
  current_level?: string;
  primary_goal?: string;
  focus_areas?: string[];
  time_commitment?: string;
  preferred_days?: string[];
  preferred_time?: string;
  session_length?: string;
  frequency?: string;
  budget_per_hour?: string;
  special_needs?: string;
  referral_source?: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  created_at: string;
}

interface AdminTutorBookingsProps {
  rows: TutorBookingRecord[];
  page: number;
  pageSize: number;
  total: number;
  search: string;
  language: string;
  status: string;
  sort?: string;
  metrics: { totalBookings: number; pending: number; inProgress: number; completed: number };
  pagination: ReactNode;
}

export default function AdminTutorBookings({ rows, metrics, search, language, status, sort = "newest", pagination }: AdminTutorBookingsProps) {
  const router = useRouter();
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname: "/admin/tutor-bookings",
    initialSearch: search,
    params: {
      q: search || undefined,
      language: language !== "all" ? language : undefined,
      status: status !== "all" ? status : undefined,
      sort: sort !== "newest" ? sort : undefined,
    },
  });
  const bookings = rows;
  const [selectedBooking, setSelectedBooking] = useState<TutorBookingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TutorBookingRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteBooking = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteAdminTutorBooking({ id: deleteTarget.id });
      if ("error" in result) {
        toast.error(result.error || "Failed to delete booking.");
        return;
      }
      if (selectedBooking?.id === deleteTarget.id) setSelectedBooking(null);
      setDeleteTarget(null);
      toast.success("Tutor booking deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete booking.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TutorBookingRecord["status"]) => {
    const result = await updateAdminTutorBooking({ id, status: newStatus });
    if ("error" in result) {
      toast.error("Failed to update status.");
      return;
    }
    toast.success(`Booking status updated to ${newStatus}`);
    router.refresh();
  };

  const filteredBookings = bookings;

  const exportToCSV = () => {
    if (filteredBookings.length === 0) {
      toast.info("No bookings available to export.");
      return;
    }

    const headers = [
      "ID",
      "Student Name",
      "Email",
      "Phone",
      "Country",
      "Timezone",
      "Language to Learn",
      "Specific Tutor",
      "Session Format",
      "Current Level",
      "Primary Goal",
      "Budget/Hour",
      "Status",
      "Date Requested",
    ];

    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.full_name || ""}"`,
      `"${b.email || ""}"`,
      `"${b.phone || ""}"`,
      `"${b.country_of_residence || ""}"`,
      `"${b.timezone || ""}"`,
      `"${b.language_to_learn || ""}"`,
      `"${b.specific_tutor || ""}"`,
      `"${b.session_format || ""}"`,
      `"${b.current_level || ""}"`,
      `"${b.primary_goal || ""}"`,
      `"${b.budget_per_hour || ""}"`,
      `"${b.status || ""}"`,
      new Date(b.created_at).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interglott_tutor_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tutor Bookings CSV export downloaded successfully.");
  };

  return (
    <AdminShell
      title="Tutor bookings"
      description="Review tutor requests, update matching status, and manage session details."
      actionLayout="two"
      actions={
        <>
          <button type="button" onClick={() => router.refresh()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="h-4 w-4 text-muted-foreground" /><span>Refresh</span>
          </button>
          <button type="button" onClick={exportToCSV} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Download className="h-4 w-4" />
            <span>
              Export CSV{filteredBookings.length > 0 ? ` · ${filteredBookings.length}` : ""}
            </span>
          </button>
        </>
      }>
      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Bookings</div>
          <div className="font-display text-2xl font-bold tabular-nums text-foreground">{metrics.totalBookings}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span>Pending Requests</span>
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-foreground">
            {metrics.pending}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="size-2 rounded-full bg-sky-500" aria-hidden="true" />
            <span>In Progress</span>
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-foreground">
            {metrics.inProgress}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Completed</span>
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-foreground">
            {metrics.completed}
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER, AND SORT BAR */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 sm:flex-row sm:items-center">
        <AdminSearchInput
          value={searchValue}
          onChange={setSearchValue}
          onClear={clearSearch}
          isPending={isPending}
          placeholder="Search by student name, email, or language..."
        />

        <select
          aria-label="Filter by language"
          value={language}
          onChange={(e) => setFilter("language", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Languages</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Spanish">Spanish</option>
          <option value="Arabic">Arabic</option>
          <option value="Chinese">Chinese</option>
        </select>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Booking Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          aria-label="Sort results"
          value={sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name_asc">Sort: Name (A–Z)</option>
        </select>
      </div>

      {/* TUTOR BOOKINGS DATA TABLE */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No tutor bookings found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border/80">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Language & Tutor</th>
                  <th className="py-3 px-4">Format & Level</th>
                  <th className="py-3 px-4">Goal & Budget</th>
                  <th className="py-3 px-4">Date Requested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{b.full_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {b.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-primary">{b.language_to_learn}</div>
                      <div className="text-xs text-muted-foreground">Tutor: {b.specific_tutor || "No preference"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground">{b.session_format || "1-on-1"}</div>
                      <div className="text-muted-foreground">{b.current_level}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-foreground">{b.primary_goal}</div>
                      <div className="text-muted-foreground font-mono">{b.budget_per_hour}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={b.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          if (["Pending", "In Progress", "Completed", "Cancelled"].includes(status)) {
                            handleStatusChange(b.id, status as TutorBookingRecord["status"]);
                          }
                        }}
                        className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AdminRowActions
                        viewLabel={`View booking for ${b.full_name}`}
                        deleteLabel={`Delete booking for ${b.full_name}`}
                        onView={() => setSelectedBooking(b)}
                        onDelete={() => setDeleteTarget(b)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination}
      </div>

      {/* BOOKING INSPECTOR MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-xl bg-card h-full overflow-y-auto border-l border-border p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Tutor Booking Record
                </span>
                <h2 className="text-xl font-display font-bold text-foreground mt-1">
                  {selectedBooking.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-muted-foreground">Student Email & Phone</div>
                <div className="font-bold text-foreground text-sm">{selectedBooking.email}</div>
                <div className="font-mono text-muted-foreground">{selectedBooking.phone || "No phone provided"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-md bg-secondary/40 border border-border/80">
                <div>
                  <span className="text-muted-foreground">Language to Learn:</span>
                  <div className="font-bold text-primary text-sm">{selectedBooking.language_to_learn}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Specific Tutor:</span>
                  <div className="font-bold text-foreground text-sm">{selectedBooking.specific_tutor || "No preference"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-md bg-secondary/40 border border-border/80">
                <div>
                  <span className="text-muted-foreground">Country & Timezone:</span>
                  <div className="font-bold text-foreground">{selectedBooking.country_of_residence || "Not specified"} ({selectedBooking.timezone || "Flexible"})</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Session Format:</span>
                  <div className="font-bold text-foreground">{selectedBooking.session_format || "1-on-1"}</div>
                </div>
              </div>

              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-muted-foreground">Focus Areas</div>
                <div className="flex flex-wrap gap-1">
                  {(selectedBooking.focus_areas || ["All areas"]).map((f) => (
                    <span key={f} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-muted-foreground">Preferred Schedule & Budget</div>
                <div className="font-bold text-foreground">
                  Days: {(selectedBooking.preferred_days || ["Flexible"]).join(", ")}
                </div>
                <div className="text-muted-foreground">
                  Time: {selectedBooking.preferred_time || "Flexible"} • Length: {selectedBooking.session_length || "1 hour"} • Frequency: {selectedBooking.frequency || "Flexible"}
                </div>
                <div className="font-bold text-emerald-600">
                  Budget: {selectedBooking.budget_per_hour || "Flexible"}
                </div>
              </div>

              {selectedBooking.special_needs && (
                <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-muted-foreground">Special Needs / Notes</div>
                  <div className="text-foreground italic">{selectedBooking.special_needs}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete tutor booking?"
        itemLabel={deleteTarget ? `${deleteTarget.full_name} (${deleteTarget.email})` : undefined}
        busy={deleting}
        onConfirm={handleDeleteBooking}
      />
    </AdminShell>
  );
}
