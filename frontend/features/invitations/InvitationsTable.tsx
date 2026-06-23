"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, RotateCcw, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { invitationsService } from "@/services/invitations.service";
import type { Invitation } from "@/types/common.types";
import { formatDate } from "@/lib/utils";
import { InviteUserDialog } from "./InviteUserDialog";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const statusColors: Record<string, string> = {
  pending:  "bg-amber-500/15 text-amber-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  expired:  "bg-muted text-muted-foreground",
  revoked:  "bg-destructive/15 text-destructive",
};

export function InvitationsTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["invitations", page, search, statusFilter],
    queryFn: () => invitationsService.list({ page, page_size: pageSize, search: search || undefined, status: statusFilter || undefined }),
  });

  const paginatedData = data?.data;
  const items: Invitation[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const revokeMutation = useMutation({
    mutationFn: (uuid: string) => invitationsService.revoke(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => alert(err?.response?.data?.message ?? "Cannot revoke"),
  });

  const resendMutation = useMutation({
    mutationFn: (uuid: string) => invitationsService.resend(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => alert(err?.response?.data?.message ?? "Cannot resend"),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => invitationsService.delete(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search invitations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Email", "Organization", "Role", "Status", "Invited By", "Expires", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No invitations match your filters." : "No invitations found."}
                  </td>
                </tr>
              ) : (
                items.map((inv, idx) => (
                  <tr key={inv.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-foreground">{inv.email}</div>
                        {inv.full_name && <div className="text-xs text-muted-foreground">{inv.full_name}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.organization_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.role_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[inv.status] ?? "bg-muted text-muted-foreground")}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.invited_by_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.expires_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === inv.uuid ? null : inv.uuid)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenu === inv.uuid && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-card shadow-lg py-1">
                              {inv.status === "pending" && (
                                <>
                                  <button onClick={() => { resendMutation.mutate(inv.uuid); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent">
                                    <RotateCcw className="w-3.5 h-3.5" /> Resend
                                  </button>
                                  <button onClick={() => { revokeMutation.mutate(inv.uuid); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent">
                                    <XCircle className="w-3.5 h-3.5" /> Revoke
                                  </button>
                                  <div className="border-t border-border my-1" />
                                </>
                              )}
                              {inv.status === "expired" && (
                                <>
                                  <button onClick={() => { resendMutation.mutate(inv.uuid); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent">
                                    <RotateCcw className="w-3.5 h-3.5" /> Resend
                                  </button>
                                  <div className="border-t border-border my-1" />
                                </>
                              )}
                              <button onClick={() => { if (confirm("Delete this invitation?")) deleteMutation.mutate(inv.uuid); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">{total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>

      {showCreate && (
        <InviteUserDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["invitations"] }); setShowCreate(false); }} />
      )}
    </div>
  );
}
