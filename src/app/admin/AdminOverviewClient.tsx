"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  FileText,
  X,
  Mail,
  UserCheck,
  Calendar,
  Sparkles,
  MessageSquare,
  Award,
  CreditCard,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Clock,
  Phone,
  Globe,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Bell,
} from "lucide-react";
import AdminEmailLogsModal from "@/components/admin/AdminEmailLogsModal";
import { AdminDeleteDialog } from "@/components/admin/AdminDeleteDialog";
import { AdminRecordDrawer, formatLabel, type InspectedRecord } from "@/components/admin/AdminRecordDrawer";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";
import {
  deleteAdminContactTicket,
  deleteAdminLead,
  deleteAdminPayment,
  updateAdminLead,
} from "@/app/actions/admin";

export type AdminTab = "all_leads" | "contact_tickets" | "bookings" | "diagnostics" | "users" | "payments";

interface LeadFormData {
  type?: string;
  estimated_cefr_level?: string;
  demographics?: { fullName?: string; email?: string; phoneNumber?: string };
  frenchBackground?: { currentLevel?: string };
  full_name?: string;
  email?: string;
  phone?: string;
  target_program?: string;
  goal?: string;
  selected_date?: string;
  selected_time?: string;
  preferred_schedule?: string;
  destination_goal?: string;
  canada_nclc_equivalent?: string;
  weighted_score?: string | number;
  percentage_score?: string | number;
}

export interface AdminUserItem {
  id: string;
  user_id: string;
  role: "admin";
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface LeadItem {
  id: string;
  user_id?: string;
  form_data: LeadFormData;
  course_selected?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContactTicketItem {
  id: string;
  path?: string;
  name: string;
  email: string;
  phone?: string;
  support_category?: string;
  support_description?: string;
  attachment_name?: string;
  subject?: string;
  general_message?: string;
  referral_source?: string;
  org_name?: string;
  org_website?: string;
  partnership_details?: string;
  something_else?: string;
  created_at: string;
}

export interface PaymentItem {
  id: string;
  user_id: string;
  user_email: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: string;
  created_at: string;
}

export default function Admin({
  tab,
  rows,
  counts,
  search,
  status,
  course,
  sort = "newest",
  pagination,
}: {
  tab: AdminTab;
  rows: (LeadItem | ContactTicketItem | AdminUserItem | PaymentItem)[];
  counts: Record<AdminTab, number>;
  search: string;
  status: string;
  course: string;
  sort?: string;
  pagination: React.ReactNode;
}) {
  const router = useRouter();
  const activeTab = tab;
  const defaultSort = activeTab === "users" ? "oldest" : "newest";
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname: "/admin",
    initialSearch: search,
    defaultSort,
    params: {
      tab: activeTab,
      q: search || undefined,
      status: status !== "all" ? status : undefined,
      course: course !== "all" ? course : undefined,
      sort: sort !== defaultSort ? sort : undefined,
    },
  });
  const leads = rows.filter((row): row is LeadItem => "form_data" in row);
  const contactTickets = rows.filter((row): row is ContactTicketItem => "support_category" in row || "path" in row);
  const payments = rows.filter((row): row is PaymentItem => "user_email" in row);
  const usersList = rows.filter((row): row is AdminUserItem => "role" in row);
  const surveyLeads = activeTab === "all_leads" ? leads : [];
  const bookingLeads = activeTab === "bookings" ? leads : [];
  const diagnosticLeads = activeTab === "diagnostics" ? leads : [];
  const searchTerm = search;
  const statusFilter = status;
  const courseFilter = course;
  const [selectedRecord, setSelectedRecord] = useState<InspectedRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "lead" | "ticket" | "payment";
    id: string;
    title: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailLogsOpen, setEmailLogsOpen] = useState<boolean>(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result =
        deleteTarget.kind === "ticket"
          ? await deleteAdminContactTicket({ id: deleteTarget.id })
          : deleteTarget.kind === "payment"
            ? await deleteAdminPayment({ id: deleteTarget.id })
            : await deleteAdminLead({ id: deleteTarget.id });
      if ("error" in result) {
        toast.error(result.error || "Could not delete record.");
        return;
      }
      if (selectedRecord && selectedRecord.data.id === deleteTarget.id) {
        setSelectedRecord(null);
      }
      setDeleteTarget(null);
      toast.success("Record deleted.");
      router.refresh();
    } catch {
      toast.error("Could not delete record.");
    } finally {
      setDeleting(false);
    }
  };

  // Update lead status through the admin API and local state.
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const result = await updateAdminLead({ id: leadId, status: newStatus });
      if (result.error) throw new Error(result.error);
      router.refresh();
      toast.success(`Status updated to ${newStatus}`);
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  // Save Admin notes
  // Export dataset to CSV
  const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const exportToCSV = () => {
    let rows: string[][] = [];
    let headers: string[] = [];
    const filename = `interglott_admin_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === "all_leads") {
      headers = ["ID", "Full Name", "Email", "Phone", "Course Selected", "Status", "Date Submitted"];
      rows = surveyLeads.map((l) => [
        csvCell(l.id),
        csvCell(l.form_data?.demographics?.fullName || l.form_data?.full_name || ""),
        csvCell(l.form_data?.demographics?.email || l.form_data?.email || ""),
        csvCell(l.form_data?.demographics?.phoneNumber || l.form_data?.phone || ""),
        csvCell(l.course_selected || ""),
        csvCell(l.status || "new"),
        csvCell(new Date(l.created_at).toLocaleString()),
      ]);
    } else if (activeTab === "contact_tickets") {
      headers = ["Ticket ID", "Name", "Email", "Phone", "Category / Subject", "Path", "Date Submitted"];
      rows = contactTickets.map((t) => [
        csvCell(t.id),
        csvCell(t.name || ""),
        csvCell(t.email || ""),
        csvCell(t.phone || ""),
        csvCell(t.support_category || t.subject || t.org_name || ""),
        csvCell(t.path || "general"),
        csvCell(new Date(t.created_at).toLocaleString()),
      ]);
    } else if (activeTab === "bookings") {
      headers = ["ID", "Full Name", "Email", "Type", "Program/Goal", "Schedule/Slot", "Date"];
      rows = bookingLeads.map((b) => [
        csvCell(b.id),
        csvCell(b.form_data?.full_name || ""),
        csvCell(b.form_data?.email || ""),
        csvCell(b.form_data?.type || "booking"),
        csvCell(b.form_data?.target_program || b.form_data?.goal || ""),
        csvCell(b.form_data?.selected_date ? `${b.form_data.selected_date} at ${b.form_data.selected_time}` : b.form_data?.preferred_schedule || ""),
        csvCell(new Date(b.created_at).toLocaleString()),
      ]);
    } else if (activeTab === "diagnostics") {
      headers = ["ID", "Candidate Name", "Email", "Goal", "CEFR Level", "NCLC Benchmark", "Score", "Date"];
      rows = diagnosticLeads.map((d) => [
        csvCell(d.id),
        csvCell(d.form_data?.full_name || ""),
        csvCell(d.form_data?.email || ""),
        csvCell(d.form_data?.destination_goal || ""),
        csvCell(d.form_data?.estimated_cefr_level || "N/A"),
        csvCell(d.form_data?.canada_nclc_equivalent || "N/A"),
        csvCell(d.form_data?.weighted_score || `${d.form_data?.percentage_score}%`),
        csvCell(new Date(d.created_at).toLocaleString()),
      ]);
    } else if (activeTab === "users") {
      headers = ["ID", "Display Name", "Email", "Role", "Date Added"];
      rows = usersList.map((u) => [
        csvCell(u.id),
        csvCell(u.display_name || ""),
        csvCell(u.email || ""),
        csvCell(u.role),
        csvCell(new Date(u.created_at).toLocaleString()),
      ]);
    } else if (activeTab === "payments") {
      headers = ["ID", "User Email", "Plan Type", "Amount", "Currency", "Transaction ID", "Status", "Date"];
      rows = payments.map((p) => [
        csvCell(p.id),
        csvCell(p.user_email),
        csvCell(p.plan_type),
        csvCell(p.amount),
        csvCell(p.currency),
        csvCell(p.transaction_id || ""),
        csvCell(p.status),
        csvCell(new Date(p.created_at).toLocaleString()),
      ]);
    }

    if (rows.length === 0) {
      toast.info("No data available to export for this view.");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully.");
  };

  return (
    <AdminShell
      title="Operations overview"
      description="Review submissions, bookings, learner activity, and payments."
      actionLayout="three"
      actions={
        <>
          <button type="button" onClick={() => setEmailLogsOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Bell className="h-4 w-4 text-muted-foreground" /><span>Email alerts</span>
          </button>
          <button type="button" onClick={() => router.refresh()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="h-4 w-4 text-muted-foreground" /><span>Refresh</span>
          </button>
          <button type="button" onClick={exportToCSV} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Download className="h-4 w-4" /><span>Export page CSV</span>
          </button>
        </>
      }>
      {/* INTERACTIVE METRIC & CATEGORY NAVIGATION CARDS */}
      <nav aria-label="Operations sections" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { id: "all_leads", label: "Intake Surveys", count: counts.all_leads, icon: Users, iconColor: "text-primary" },
          { id: "contact_tickets", label: "Contact Desk", count: counts.contact_tickets, icon: MessageSquare, iconColor: "text-emerald-600" },
          { id: "bookings", label: "Bookings & Calls", count: counts.bookings, icon: Calendar, iconColor: "text-amber-600" },
          { id: "diagnostics", label: "Diagnostics", count: counts.diagnostics, icon: Award, iconColor: "text-purple-600" },
          { id: "users", label: "Admin Users", count: counts.users, icon: ShieldCheck, iconColor: "text-indigo-600" },
          { id: "payments", label: "Payments", count: counts.payments, icon: CreditCard, iconColor: "text-sky-600" },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={`/admin?tab=${item.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[104px] flex-col justify-between rounded-xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-background/60 text-foreground hover:border-primary/35 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wider leading-snug ${
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground/90" : item.iconColor}`} aria-hidden="true" />
              </div>
              <div className={`font-display text-2xl font-bold tabular-nums tracking-tight ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                {item.count}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* SEARCH, FILTER, AND SORT BAR */}
      {(() => {
        const showStatusFilter = activeTab !== "contact_tickets" && activeTab !== "users";
        const showCourseFilter = activeTab === "all_leads" || activeTab === "bookings" || activeTab === "diagnostics";
        return (
          <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 sm:flex-row sm:items-center">
            <AdminSearchInput
              value={searchValue}
              onChange={setSearchValue}
              onClear={clearSearch}
              isPending={isPending}
              placeholder="Search by name, email, phone, or subject..."
            />

            {showStatusFilter && (
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setFilter("status", e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="all">All Statuses</option>
                {activeTab === "payments" ? (
                  <>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                ) : (
                  <>
                    <option value="new">New</option>
                    <option value="in_review">In Review</option>
                    <option value="matched">Matched</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                  </>
                )}
              </select>
            )}

            {showCourseFilter && (
              <select
                aria-label="Filter by course track"
                value={courseFilter}
                onChange={(e) => setFilter("course", e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="all">All Course Tracks</option>
                <option value="tcf">TCF Canada</option>
                <option value="tef">TEF Canada</option>
                <option value="delf_dalf">DELF / DALF</option>
                <option value="business">Business French</option>
                <option value="other_languages">Other Languages</option>
                <option value="free_resources">Free Resources</option>
              </select>
            )}

            <select
              aria-label="Sort results"
              value={sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              {(activeTab === "contact_tickets" || activeTab === "users") && (
                <option value="name_asc">Sort: Name (A–Z)</option>
              )}
              {activeTab === "payments" && (
                <>
                  <option value="amount_desc">Sort: Amount (High–Low)</option>
                  <option value="amount_asc">Sort: Amount (Low–High)</option>
                </>
              )}
            </select>
          </div>
        );
      })()}

      {/* TAB DATA TABLES */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <>
            {/* TAB 1: INTAKE SURVEY LEADS */}
            {activeTab === "all_leads" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Student Candidate</th>
                      <th className="py-3 px-4">Course Track</th>
                      <th className="py-3 px-4">Current Level</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {surveyLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">
                          No intake survey submissions found matching your filters.
                        </td>
                      </tr>
                    ) : surveyLeads.map((lead) => {
                      const demo = lead.form_data?.demographics;
                      const bg = lead.form_data?.frenchBackground;
                      const candidateName = demo?.fullName || lead.form_data?.full_name || "Anonymous Candidate";
                      const candidateEmail = demo?.email || lead.form_data?.email || "No email";
                      return (
                        <tr key={lead.id || lead.created_at} className="transition-colors hover:bg-muted/30">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{candidateName}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{candidateEmail}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {formatLabel(lead.course_selected)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                            {bg?.currentLevel || "Not set"}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status || "new"}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                            >
                              <option value="new">New</option>
                              <option value="in_review">In Review</option>
                              <option value="matched">Matched</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                            </select>
                          </td>
                          <td className="whitespace-nowrap py-3.5 px-4 text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <AdminRowActions
                              viewLabel={`View ${candidateName}`}
                              deleteLabel={`Delete ${candidateName}`}
                              onView={() => setSelectedRecord({ type: "lead", data: lead })}
                              onDelete={() =>
                                setDeleteTarget({
                                  kind: "lead",
                                  id: lead.id,
                                  title: "Delete intake submission?",
                                  label: `${candidateName} (${candidateEmail})`,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: CONTACT DESK TICKETS */}
            {activeTab === "contact_tickets" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Intent</th>
                      <th className="py-3 px-4">Category / Subject</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {contactTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">
                          No contact tickets found matching your filters.
                        </td>
                      </tr>
                    ) : contactTickets.map((ticket) => (
                      <tr key={ticket.id} className="transition-colors hover:bg-muted/30">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{ticket.name}</div>
                          <div className="text-xs text-muted-foreground">{ticket.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex whitespace-nowrap rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            {formatLabel(ticket.path, "General")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">
                            {ticket.support_category || ticket.subject || "General Message"}
                          </div>
                          {ticket.org_name && (
                            <div className="text-xs text-muted-foreground">{ticket.org_name}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3.5 px-4 text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <AdminRowActions
                            viewLabel={`View message from ${ticket.name}`}
                            deleteLabel={`Delete message from ${ticket.name}`}
                            onView={() => setSelectedRecord({ type: "ticket", data: ticket })}
                            onDelete={() =>
                              setDeleteTarget({
                                kind: "ticket",
                                id: ticket.id,
                                title: "Delete contact submission?",
                                label: `${ticket.name} (${ticket.email})`,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: STRATEGY CALLS & TUTOR BOOKINGS */}
            {activeTab === "bookings" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Booking Type</th>
                      <th className="py-3 px-4">Target Program / Goal</th>
                      <th className="py-3 px-4">Requested Slot</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bookingLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">
                          No strategy calls or tutor booking requests found matching your filters.
                        </td>
                      </tr>
                    ) : bookingLeads.map((booking) => {
                      const applicantName = booking.form_data?.full_name || "Applicant";
                      const applicantEmail = booking.form_data?.email || "No email";
                      return (
                        <tr key={booking.id || booking.created_at} className="transition-colors hover:bg-muted/30">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{applicantName}</div>
                            <div className="text-xs text-muted-foreground">{applicantEmail}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex whitespace-nowrap rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              {booking.form_data?.type === "clarity_call_booking" ? "Clarity Call" : "Tutor Request"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {booking.form_data?.target_program || booking.form_data?.goal || "General"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {booking.form_data?.selected_date ? `${booking.form_data.selected_date} (${booking.form_data.selected_time})` : booking.form_data?.preferred_schedule || "Flexible"}
                          </td>
                          <td className="whitespace-nowrap py-3.5 px-4 text-xs text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <AdminRowActions
                              viewLabel={`View booking from ${applicantName}`}
                              deleteLabel={`Delete booking from ${applicantName}`}
                              onView={() => setSelectedRecord({ type: "booking", data: booking })}
                              onDelete={() =>
                                setDeleteTarget({
                                  kind: "lead",
                                  id: booking.id,
                                  title: "Delete booking request?",
                                  label: `${applicantName} (${applicantEmail})`,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: PLACEMENT DIAGNOSTICS */}
            {activeTab === "diagnostics" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Destination Goal</th>
                      <th className="py-3 px-4">CEFR Level</th>
                      <th className="py-3 px-4">NCLC Benchmark</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {diagnosticLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">
                          No placement diagnostics found matching your filters.
                        </td>
                      </tr>
                    ) : diagnosticLeads.map((diag) => {
                      const candidateName = diag.form_data?.full_name || "Candidate";
                      const candidateEmail = diag.form_data?.email || "No email";
                      return (
                        <tr key={diag.id || diag.created_at} className="transition-colors hover:bg-muted/30">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{candidateName}</div>
                            <div className="text-xs text-muted-foreground">{candidateEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {diag.form_data?.destination_goal || "General"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                              CEFR {diag.form_data?.estimated_cefr_level || "N/A"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-emerald-700">
                            {diag.form_data?.canada_nclc_equivalent || "N/A"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold tabular-nums">
                            {diag.form_data?.weighted_score || `${diag.form_data?.percentage_score}%`}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <AdminRowActions
                              viewLabel={`View diagnostic for ${candidateName}`}
                              deleteLabel={`Delete diagnostic for ${candidateName}`}
                              onView={() => setSelectedRecord({ type: "diagnostic", data: diag })}
                              onDelete={() =>
                                setDeleteTarget({
                                  kind: "lead",
                                  id: diag.id,
                                  title: "Delete placement diagnostic?",
                                  label: `${candidateName} (${candidateEmail})`,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 5: ADMIN USERS */}
            {activeTab === "users" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-foreground">Authorized System Administrators</h3>
                  <Link href="/admin/users" className="text-xs text-primary font-bold hover:underline">
                    Manage Admin Roles &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usersList.map((u) => (
                    <div key={u.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 p-4">
                      <div className="min-w-0 space-y-0.5">
                        <div className="truncate font-semibold text-foreground text-sm">
                          {u.display_name || u.email || "Administrator"}
                        </div>
                        {u.display_name && u.email && (
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        )}
                        <div className="text-xs font-medium text-muted-foreground">Admin</div>
                      </div>
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: PAYMENTS */}
            {activeTab === "payments" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-foreground">Recent Subscriptions & Transactions</h3>
                  <Link href="/admin/payments" className="text-xs text-primary font-bold hover:underline">
                    Detailed Payments Ledger &rarr;
                  </Link>
                </div>
                {payments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No payment records detected in live database yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-3 px-4">Account</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {payments.map((p) => (
                          <tr key={p.id} className="transition-colors hover:bg-muted/30">
                            <td className="py-3.5 px-4 font-semibold">{p.user_email}</td>
                            <td className="py-3.5 px-4 text-xs font-medium">{formatLabel(p.plan_type)}</td>
                            <td className="py-3.5 px-4 font-semibold tabular-nums text-emerald-700">{p.currency} {Number(p.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-xs font-medium">{formatLabel(p.status)}</td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4 text-right">
                              <AdminRowActions
                                deleteLabel={`Delete payment from ${p.user_email}`}
                                onDelete={() =>
                                  setDeleteTarget({
                                    kind: "payment",
                                    id: p.id,
                                    title: "Delete payment record?",
                                    label: `${p.user_email} (${p.currency} ${Number(p.amount).toFixed(2)})`,
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
      </div>
      {pagination}

      {/* STRUCTURED RECORD DETAIL DRAWER */}
      <AdminRecordDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDelete={(rec) => {
          if (rec.type === "ticket") {
            setDeleteTarget({
              kind: "ticket",
              id: rec.data.id,
              title: "Delete contact submission?",
              label: `${rec.data.name} (${rec.data.email})`,
            });
          } else {
            const name = rec.data.form_data?.demographics?.fullName || rec.data.form_data?.full_name || "this record";
            const email = rec.data.form_data?.demographics?.email || rec.data.form_data?.email || "";
            setDeleteTarget({
              kind: "lead",
              id: rec.data.id,
              title: rec.type === "booking" ? "Delete booking request?" : rec.type === "diagnostic" ? "Delete placement diagnostic?" : "Delete intake submission?",
              label: email ? `${name} (${email})` : name,
            });
          }
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title || "Delete record?"}
        itemLabel={deleteTarget?.label}
        busy={deleting}
        onConfirm={handleConfirmDelete}
      />

      {/* ADMIN EMAIL DEVICE NOTIFICATION LOGS MODAL */}
      <AdminEmailLogsModal isOpen={emailLogsOpen} onClose={() => setEmailLogsOpen(false)} />
    </AdminShell>
  );
}
