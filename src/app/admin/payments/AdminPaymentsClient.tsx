"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { decideAdminPayments, deleteAdminPayment } from "@/app/actions/admin";
import { AdminDeleteDialog } from "@/components/admin/AdminDeleteDialog";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";

const PLAN_LABELS: Record<string, string> = {
  basic_premium: "Basic",
  pro: "Pro",
  sapphire: "Sapphire",
};

interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  plan_type: string;
  amount: number;
  currency: string;
  transaction_id: string | null;
  status: string;
  payment_date: string;
  approval_date: string | null;
  admin_notes: string | null;
}

interface AdminPaymentsProps {
  rows: Payment[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: "pending" | "approved" | "rejected";
  sort?: string;
  metrics: { pending: number; approved: number; rejected: number };
  pagination: ReactNode;
}

export default function AdminPayments({ rows, total, search, status, sort = "newest", metrics, pagination }: AdminPaymentsProps) {
  const router = useRouter();
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname: "/admin/payments",
    initialSearch: search,
    params: {
      status,
      q: search || undefined,
      sort: sort !== "newest" ? sort : undefined,
    },
  });
  const payments = rows;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filtered = payments;
  const tab = status;

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteAdminPayment({ id: deleteTarget.id });
      if ("error" in result) {
        toast({ title: "Delete failed", description: result.error });
        return;
      }
      setDeleteTarget(null);
      toast({ title: "Payment deleted" });
      router.refresh();
    } catch {
      toast({ title: "Delete failed", description: "Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  const decide = async (p: Payment, approve: boolean) => {
    setBusyId(p.id);
    const result = await decideAdminPayments({ ids: [p.id], status: approve ? "approved" : "rejected" });
    if ("error" in result) {
      toast({ title: "Update failed", description: result.error });
      setBusyId(null);
      return;
    }

    toast({ title: approve ? "Payment approved" : "Payment rejected" });
    setBusyId(null);
    router.refresh();
  };

  const bulkDecide = async (approve: boolean) => {
    if (selected.size === 0) return;
    if (!confirm(`${approve ? "Approve" : "Reject"} ${selected.size} payment(s)?`)) return;
    setBulkBusy(true);
    const result = await decideAdminPayments({ ids: [...selected], status: approve ? "approved" : "rejected" });
    setBulkBusy(false);
    setSelected(new Set());
    if ("error" in result) toast({ title: "Bulk update failed", description: result.error });
    else toast({ title: `Bulk ${approve ? "approve" : "reject"} complete`, description: `${selected.size} payment(s) updated.` });
    router.refresh();
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (filtered.every((p) => selected.has(p.id))) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  return (
    <AdminShell title="Payments" description="Review payment submissions and manage approvals.">
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="sm"
          asChild
            className={`rounded-none border-b-2 ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            <Link href={`/admin/payments?status=${t}${search ? `&q=${encodeURIComponent(search)}` : ""}${sort !== "newest" ? `&sort=${encodeURIComponent(sort)}` : ""}`}>
              {t[0].toUpperCase() + t.slice(1)} ({metrics[t]})
            </Link>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 sm:flex-row sm:items-center">
        <AdminSearchInput
          value={searchValue}
          onChange={setSearchValue}
          onClear={clearSearch}
          isPending={isPending}
          placeholder="Search by email, transaction ID, or plan…"
        />
        <select
          aria-label="Sort payments"
          value={sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="amount_desc">Sort: Amount (High–Low)</option>
          <option value="amount_asc">Sort: Amount (Low–High)</option>
        </select>
      </div>

      {tab === "pending" && filtered.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={toggleSelectAll}>
            {filtered.every((p) => selected.has(p.id)) ? "Clear selection" : "Select all"}
          </Button>
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => bulkDecide(true)} disabled={selected.size === 0 || bulkBusy}>
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Approve selected
            </Button>
            <Button size="sm" variant="destructive" onClick={() => bulkDecide(false)} disabled={selected.size === 0 || bulkBusy}>
              <X className="h-4 w-4 mr-1" /> Reject selected
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No {tab} payments.</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2">{tab === "pending" && <span className="sr-only">Select</span>}</th>
                <th className="px-3 py-2 font-semibold">Account</th>
                <th className="px-3 py-2 font-semibold">Plan</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Transaction</th>
                <th className="px-3 py-2 font-semibold">Submitted</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
          {filtered.map((p) => (
            <tr key={p.id} className="align-middle hover:bg-secondary/30">
              <td className="px-3 py-2">{p.status === "pending" && <Checkbox aria-label={`Select payment from ${p.user_email}`} checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />}</td>
              <td className="px-3 py-2"><p className="font-medium">{p.user_email}</p></td>
              <td className="px-3 py-2">{PLAN_LABELS[p.plan_type] ?? p.plan_type}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{p.currency} {Number(p.amount).toFixed(2)}</td>
              <td className="max-w-48 truncate px-3 py-2 font-mono text-xs" title={p.transaction_id ?? undefined}>{p.transaction_id ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
              <td className="px-3 py-2"><Badge variant={p.status === "pending" ? "secondary" : p.status === "approved" ? "default" : "destructive"}>{p.status}</Badge></td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  {p.status === "pending" && (
                    <>
                      <Button size="icon" className="btn-icon-sm size-8" onClick={() => decide(p, true)} disabled={busyId === p.id} aria-label={`Approve payment from ${p.user_email}`} title="Approve">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="btn-icon-sm size-8" onClick={() => decide(p, false)} disabled={busyId === p.id} aria-label={`Reject payment from ${p.user_email}`} title="Reject">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <AdminRowActions
                    deleteLabel={`Delete payment from ${p.user_email}`}
                    onDelete={() => setDeleteTarget(p)}
                  />
                </div>
              </td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination}
    </div>
    <AdminDeleteDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      title="Delete payment record?"
      itemLabel={deleteTarget ? `${deleteTarget.user_email} (${deleteTarget.currency} ${Number(deleteTarget.amount).toFixed(2)})` : undefined}
      busy={deleting}
      onConfirm={handleDeletePayment}
    />
    </AdminShell>
  );
}
