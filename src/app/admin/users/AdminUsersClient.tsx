"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { manageAdminUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, EyeOff, Loader2, Plus, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useAdminTableQuery } from "@/hooks/useAdminTableQuery";

interface AdminRow {
  id: string;
  user_id: string;
  created_at: string;
  granted_by: string | null;
  email: string | null;
  display_name: string | null;
  granted_by_email: string | null;
}

interface AdminUsersProps {
  rows: AdminRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  sort?: string;
  pagination: ReactNode;
}

type AccessDialog = "grant" | "create" | null;

export default function AdminUsers({ rows, total, search, sort = "oldest", pagination }: AdminUsersProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { searchValue, setSearchValue, clearSearch, setFilter, isPending } = useAdminTableQuery({
    pathname: "/admin/users",
    initialSearch: search,
    defaultSort: "oldest",
    params: {
      q: search || undefined,
      sort: sort !== "oldest" ? sort : undefined,
    },
  });
  const currentUserId = session?.user?.id ?? null;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<AccessDialog>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminRow | null>(null);
  const filteredRows = rows;

  const grant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setBusy(true);
    try {
      const result = await manageAdminUser({ action: "grant", email: normalizedEmail });
      if ("error" in result) {
        toast({ title: "Could not grant admin", description: result.error });
        return;
      }
      toast({ title: "Admin granted", description: `${normalizedEmail} is now an admin.` });
      setEmail("");
      setDialog(null);
      router.refresh();
    } catch {
      toast({ title: "Could not grant admin", description: "The admin service could not be reached." });
    } finally {
      setBusy(false);
    }
  };

  const createAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = createEmail.trim().toLowerCase();
    if (!normalizedEmail || createPassword.length < 8) {
      toast({ title: "Invalid input", description: "Enter a valid email and password (min 8 chars)." });
      return;
    }
    setCreating(true);
    try {
      const result = await manageAdminUser({
        action: "create",
        email: normalizedEmail,
        password: createPassword,
        name: createName.trim() || normalizedEmail,
      });
      if ("error" in result) {
        toast({ title: "Could not create admin", description: result.error });
        return;
      }
      toast({
        title: "Admin created",
        description: result.created ? `Account created for ${normalizedEmail}` : `${normalizedEmail} promoted to admin`,
      });
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      setDialog(null);
      router.refresh();
    } catch {
      toast({ title: "Could not create admin", description: "The admin service could not be reached." });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    if (revokeTarget.user_id === currentUserId) {
      toast({ title: "You can't revoke yourself", description: "Ask another admin to do this." });
      setRevokeTarget(null);
      return;
    }
    setRevokingId(revokeTarget.id);
    try {
      const result = await manageAdminUser({ action: "revoke", roleId: revokeTarget.id });
      if ("error" in result) toast({ title: "Revoke failed", description: result.error });
      else {
        toast({ title: "Admin revoked" });
        setRevokeTarget(null);
        router.refresh();
      }
    } catch {
      toast({ title: "Revoke failed", description: "The admin service could not be reached." });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <AdminShell
      title="Admin users"
      description="Manage access to the platform administration tools."
      actionLayout="two"
      actions={
        <>
          <Button variant="outline" onClick={() => setDialog("grant")}>
            <UserPlus aria-hidden="true" /> Grant access
          </Button>
          <Button onClick={() => setDialog("create")}>
            <Plus aria-hidden="true" /> Create admin
          </Button>
        </>
      }
    >
      <section className="space-y-4" aria-labelledby="admin-users-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="admin-users-heading" className="font-display text-base font-semibold">Administrator access</h2>
            <p className="mt-1 text-sm text-muted-foreground">{total} authorized {total === 1 ? "administrator" : "administrators"}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <AdminSearchInput
              value={searchValue}
              onChange={setSearchValue}
              onClear={clearSearch}
              isPending={isPending}
              placeholder="Search admins..."
              ariaLabel="Search admin users"
              className="w-full sm:w-64"
            />
            <select
              aria-label="Sort administrators"
              value={sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="oldest">Sort: Oldest</option>
              <option value="newest">Sort: Newest</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead className="min-w-48">Administrator</TableHead>
                <TableHead className="hidden min-w-32 sm:table-cell">Access</TableHead>
                <TableHead className="hidden min-w-48 md:table-cell">Added by</TableHead>
                <TableHead className="hidden min-w-32 md:table-cell">Date added</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const isCurrentUser = row.user_id === currentUserId;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-64">
                      <div className="truncate font-medium">{row.display_name || row.email || "Administrator"}</div>
                      {row.display_name && row.email && (
                        <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                      )}
                      <div className="mt-1 sm:hidden">
                        <Badge variant="secondary">Admin</Badge>
                        {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">You</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Admin</Badge>
                        {isCurrentUser && <span className="text-xs text-muted-foreground">You</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {row.granted_by_email || (row.granted_by ? "Another administrator" : "Initial administrator")}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokeTarget(row)}
                        disabled={isCurrentUser || revokingId === row.id}
                        aria-label={`Revoke admin access for ${row.email ?? "this administrator"}`}
                        title={isCurrentUser ? "You can't revoke yourself" : "Revoke admin access"}
                      >
                        {revokingId === row.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        <span className="hidden sm:inline">Revoke</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    {total ? "No admins match this search." : "No administrators have been added yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pagination}
        </div>
      </section>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!busy && !creating) { setDialog(open ? dialog : null); if (!open) setShowCreatePassword(false); } }}>
        <DialogContent className="max-h-[90svh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
          {dialog === "grant" ? (
            <>
              <DialogHeader>
                <DialogTitle>Grant admin access</DialogTitle>
                <DialogDescription>The user must already have an Interglott account.</DialogDescription>
              </DialogHeader>
              <form onSubmit={grant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grant-admin-email">Account email</Label>
                  <Input id="grant-admin-email" type="email" placeholder="user@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
                  <Button type="submit" disabled={busy || !email.trim()}>
                    {busy ? <Loader2 className="animate-spin" /> : <UserPlus />}
                    Grant access
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : dialog === "create" ? (
            <>
              <DialogHeader>
                <DialogTitle>Create admin account</DialogTitle>
                <DialogDescription>Creates a new account with a temporary password and grants it admin access.</DialogDescription>
              </DialogHeader>
              <form onSubmit={createAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-admin-name">Display name <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="create-admin-name" value={createName} onChange={(event) => setCreateName(event.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-admin-email">Email</Label>
                  <Input id="create-admin-email" type="email" placeholder="admin@interglott.com" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-admin-password">Temporary password</Label>
                  <div className="relative">
                    <Input id="create-admin-password" type={showCreatePassword ? "text" : "password"} placeholder="Enter temporary password" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} minLength={8} autoComplete="new-password" className="pr-10" required />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((prev) => !prev)}
                      aria-label={showCreatePassword ? "Hide temporary password" : "Show temporary password"}
                      aria-pressed={showCreatePassword}
                      className="btn-icon-sm absolute inset-y-0 right-0 flex h-full items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={creating}>Cancel</Button>
                  <Button type="submit" disabled={creating || !createEmail.trim() || createPassword.length < 8}>
                    {creating ? <Loader2 className="animate-spin" /> : <Plus />}
                    Create admin
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeTarget !== null} onOpenChange={(open) => { if (!open && !revokingId) setRevokeTarget(null); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.display_name || revokeTarget?.email || "This administrator"} will lose access to the administration tools. Their account and data will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void revoke(); }} disabled={revokingId !== null} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {revokingId ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
