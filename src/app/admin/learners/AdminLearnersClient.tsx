"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDeleteDialog } from "@/components/admin/AdminDeleteDialog";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";
import { deleteAdminLearner } from "@/app/actions/admin";
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
  Sparkles,
} from "lucide-react";

export interface LearnerRecord {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  country_code?: string;
  target_languages: string[];
  created_at: string;
}

interface AdminLearnersProps {
  rows: LearnerRecord[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  language: string;
  sort?: string;
  metrics: { totalRegistered: number; french: number; germanSpanish: number; chineseArabic: number };
  pagination: ReactNode;
}

export default function AdminLearners({ rows, metrics, search, language, sort = "newest", pagination }: AdminLearnersProps) {
  const pathname = usePathname() || "/admin/learners";
  const router = useRouter();
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname,
    initialSearch: search,
    params: {
      q: search || undefined,
      language: language !== "all" ? language : undefined,
      sort: sort !== "newest" ? sort : undefined,
    },
  });
  const learners = rows;
  const [selectedLearner, setSelectedLearner] = useState<LearnerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearnerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filteredLearners = learners;

  const handleDeleteLearner = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteAdminLearner({ id: deleteTarget.id });
      if ("error" in result) {
        toast.error(result.error || "Failed to delete learner.");
        return;
      }
      if (selectedLearner?.id === deleteTarget.id) setSelectedLearner(null);
      setDeleteTarget(null);
      toast.success("Learner deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete learner.");
    } finally {
      setDeleting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredLearners.length === 0) {
      toast.info("No learners available to export.");
      return;
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Country Code",
      "Phone Number",
      "Languages Selected",
      "Date Joined",
    ];

    const rows = filteredLearners.map((l) => [
      l.id,
      `"${l.first_name || ""}"`,
      `"${l.last_name || ""}"`,
      `"${l.email || ""}"`,
      `"${l.country_code || "+1"}"`,
      `"${l.phone_number || ""}"`,
      `"${(l.target_languages || []).join(", ")}"`,
      new Date(l.created_at).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `interglott_learners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Learners CSV export downloaded successfully.");
  };

  return (
    <AdminShell
      title="Registered learners"
      description="Review registrations, target language preferences, and contact details."
      actionLayout="two"
      actions={
        <>
          <button type="button" onClick={() => router.refresh()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="h-4 w-4 text-muted-foreground" /><span>Refresh</span>
          </button>
          <button type="button" onClick={exportToCSV} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Download className="h-4 w-4" />
            <span>Export CSV{filteredLearners.length > 0 ? ` · ${filteredLearners.length}` : ""}</span>
          </button>
        </>
      }>
      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Registered</div>
          <div className="font-display text-2xl font-bold tabular-nums text-foreground">{metrics.totalRegistered}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">French Learners</div>
          <div className="font-display text-2xl font-bold tabular-nums text-primary">
            {metrics.french}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">German & Spanish</div>
          <div className="font-display text-2xl font-bold tabular-nums text-emerald-600">
            {metrics.germanSpanish}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Chinese & Arabic</div>
          <div className="font-display text-2xl font-bold tabular-nums text-amber-600">
            {metrics.chineseArabic}
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
          placeholder="Search by learner name, email, or phone number..."
        />

        <select
          aria-label="Filter by target language"
          value={language}
          onChange={(e) => setFilter("language", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Target Languages</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Chinese">Chinese</option>
          <option value="Arabic">Arabic</option>
          <option value="Spanish">Spanish</option>
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

      {/* LEARNERS DATA TABLE */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        {filteredLearners.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No registered learners found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border/80">
                <tr>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Languages Selected</th>
                  <th className="py-3 px-4">Date Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">
                        {learner.first_name} {learner.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {learner.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {learner.phone_number ? (
                        <div className="flex items-center gap-1 text-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {learner.country_code || "+1"} {learner.phone_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(learner.target_languages || ["French"]).map((lang) => (
                          <span
                            key={lang}
                            className="font-bold text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(learner.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AdminRowActions
                        viewLabel={`View ${learner.first_name} ${learner.last_name}`}
                        deleteLabel={`Delete ${learner.first_name} ${learner.last_name}`}
                        onView={() => setSelectedLearner(learner)}
                        onDelete={() => setDeleteTarget(learner)}
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

      {/* LEARNER INSPECTOR MODAL */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-xl bg-card h-full overflow-y-auto border-l border-border p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Learner Profile Record
                </span>
                <h2 className="text-xl font-display font-bold text-foreground mt-1">
                  {selectedLearner.first_name} {selectedLearner.last_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLearner(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-xs text-muted-foreground">Email Address</div>
                <div className="font-bold text-foreground text-sm">{selectedLearner.email}</div>
              </div>

              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-xs text-muted-foreground">Phone Number with Country Code</div>
                <div className="font-bold text-foreground text-sm font-mono">
                  {selectedLearner.country_code || "+1"} {selectedLearner.phone_number || "Not provided"}
                </div>
              </div>

              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-xs text-muted-foreground">Target Languages Selected</div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedLearner.target_languages || ["French"]).map((l) => (
                    <span key={l} className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-md bg-secondary/40 border border-border/80 space-y-2">
                <div className="text-xs text-muted-foreground">Sign Up Timestamp</div>
                <div className="font-mono text-xs text-foreground">
                  {new Date(selectedLearner.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete learner record?"
        itemLabel={deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.email})` : undefined}
        busy={deleting}
        onConfirm={handleDeleteLearner}
      />
    </AdminShell>
  );
}
