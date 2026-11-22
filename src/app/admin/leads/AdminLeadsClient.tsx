"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LeadRecord, LeadStatus } from "@/types/kyc";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDeleteDialog } from "@/components/admin/AdminDeleteDialog";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";
import { deleteAdminLead, updateAdminLead } from "@/app/actions/admin";
import { Search, Download, Eye, X, Mail } from "lucide-react";

interface AdminLeadsProps {
  rows: LeadRecord[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  course: string;
  sort?: string;
  pagination: ReactNode;
}

export default function AdminLeads({ rows, search, status, course, sort = "newest", pagination }: AdminLeadsProps) {
  const router = useRouter();
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname: "/admin/leads",
    initialSearch: search,
    params: {
      q: search || undefined,
      status: status !== "all" ? status : undefined,
      course: course !== "all" ? course : undefined,
      sort: sort !== "newest" ? sort : undefined,
    },
  });
  const leads = rows;
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteAdminLead({ id: deleteTarget.id });
      if ("error" in result) {
        toast.error(result.error || "Failed to delete lead.");
        return;
      }
      if (selectedLead?.id === deleteTarget.id) setSelectedLead(null);
      setDeleteTarget(null);
      toast.success("Lead deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete lead.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const result = await updateAdminLead({ id: leadId, status: newStatus });
    if ("error" in result) {
      toast.error("Failed to update status.");
      return;
    }
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status: newStatus });
    toast.success(`Lead status updated to ${newStatus}`);
    router.refresh();
  };

  const handleSaveNotes = async (leadId: string, notes: string) => {
    const result = await updateAdminLead({ id: leadId, adminNotes: notes });
    if ("error" in result) {
      toast.error("Failed to save notes.");
      return;
    }
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, admin_notes: notes });
    toast.success("Admin notes saved.");
    router.refresh();
  };

  const filteredLeads = leads;

  // Export to CSV
  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      toast.info("No leads available to export.");
      return;
    }

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Country",
      "Course Selected",
      "Current Level",
      "Target CLB",
      "Status",
      "Date Submitted",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.id,
      `"${lead.form_data?.demographics?.fullName || ""}"`,
      `"${lead.form_data?.demographics?.email || ""}"`,
      `"${lead.form_data?.demographics?.phoneNumber || ""}"`,
      `"${lead.form_data?.demographics?.country || ""}"`,
      `"${lead.course_selected || ""}"`,
      `"${lead.form_data?.frenchBackground?.currentLevel || ""}"`,
      `"${lead.form_data?.courseSpecific?.targetCLB || ""}"`,
      lead.status,
      new Date(lead.created_at).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `interglott_leads_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded.");
  };

  return (
    <AdminShell
      title="Intake leads"
      description="Review student intake submissions, match tutors, and update lead status."
      actions={
        <button
          type="button"
          onClick={exportToCSV}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" />
          <span>
            Export CSV{filteredLeads.length > 0 ? ` · ${filteredLeads.length}` : ""}
          </span>
        </button>
      }
    >
      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 sm:flex-row sm:items-center">
        <AdminSearchInput
          value={searchValue}
          onChange={setSearchValue}
          onClear={clearSearch}
          isPending={isPending}
          placeholder="Search by name or email..."
        />

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="matched">Matched</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>

        <select
          aria-label="Filter by course"
          value={course}
          onChange={(e) => setFilter("course", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Courses</option>
          <option value="tcf">TCF Canada</option>
          <option value="tef">TEF Canada</option>
          <option value="delf_dalf">DELF / DALF</option>
          <option value="business">Business French</option>
          <option value="other_languages">Other Languages</option>
          <option value="free_resources">Free Resources</option>
        </select>

        <select
          aria-label="Sort results"
          value={sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No intake survey submissions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border/80">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course Track</th>
                  <th className="py-3 px-4">Current Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead) => {
                  const demo = lead.form_data?.demographics;
                  const bg = lead.form_data?.frenchBackground;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {demo?.fullName || "Anonymous Student"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {demo?.email || "No email"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold uppercase tracking-wider text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                          {lead.course_selected || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-numeric font-medium">
                          {bg?.currentLevel || "Not set"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(
                              lead.id,
                              e.target.value as LeadStatus,
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="in_review">In Review</option>
                          <option value="matched">Matched</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <AdminRowActions
                          viewLabel={`View details for ${demo?.fullName || "student"}`}
                          deleteLabel={`Delete lead for ${demo?.fullName || "student"}`}
                          onView={() => setSelectedLead(lead)}
                          onDelete={() => setDeleteTarget(lead)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination}
      </div>

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-2xl bg-card h-full overflow-y-auto border-l border-border p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Lead Submission Details
                </span>
                <h2 className="text-xl font-display font-bold text-foreground mt-1">
                  {selectedLead.form_data?.demographics?.fullName ||
                    "Student Lead"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions & Notes */}
            <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Internal Admin Notes
              </label>
              <textarea
                key={selectedLead.id}
                rows={3}
                placeholder="Add notes regarding instructor matching, email contact dates, or student requirements..."
                defaultValue={selectedLead.admin_notes || ""}
                onBlur={(e) => handleSaveNotes(selectedLead.id, e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Section 1: Demographics */}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                1. Demographics & Contact
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.demographics?.email}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.demographics?.phoneNumber || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Country:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.demographics?.country || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Timezone:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.demographics?.timeZone || "N/A"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 2: Course & Specifics */}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                2. Course Strategy & Benchmark
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Course:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.course_selected}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Level:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.frenchBackground?.currentLevel}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Target CLB:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.courseSpecific?.targetCLB || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Exam Horizon:</span>{" "}
                  <strong className="text-foreground">
                    {selectedLead.form_data?.courseSpecific?.examTimeline ||
                      "N/A"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 3: Success Goal & Motivation */}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                3. Success Goal Definition
              </h3>
              <p className="text-xs text-foreground bg-secondary/30 p-3 rounded-md border border-border/50">
                "
                {selectedLead.form_data?.successMetrics?.successDefinition ||
                  "No specific goal text provided"}
                "
              </p>
            </div>

            {/* Section 4: Instructor Notes */}
            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                4. Student Notes for Instructor
              </h3>
              <p className="text-xs text-muted-foreground italic">
                "
                {selectedLead.form_data?.modality?.instructorNotes ||
                  "None specified"}
                "
              </p>
            </div>
          </div>
        </div>
      )}
      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete intake lead?"
        itemLabel={
          deleteTarget
            ? `${deleteTarget.form_data?.demographics?.fullName || "Anonymous Student"}${deleteTarget.form_data?.demographics?.email ? ` (${deleteTarget.form_data.demographics.email})` : ""}`
            : undefined
        }
        busy={deleting}
        onConfirm={handleDeleteLead}
      />
    </AdminShell>
  );
}
