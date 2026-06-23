"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { orgAssignmentsService } from "@/services/org-assignments.service";
import { usersService } from "@/services/users.service";
import { organizationsService } from "@/services/organizations.service";
import type { OrgAssignment } from "@/types/common.types";
import { formatDate } from "@/lib/utils";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function AssignDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [userId, setUserId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [type, setType] = useState("SECONDARY");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: usersData } = useQuery({ queryKey: ["users-all-assign"], queryFn: () => usersService.list({ page: 1, page_size: 200 }), staleTime: 60000 });
  const { data: orgsData } = useQuery({ queryKey: ["organizations-all"], queryFn: () => organizationsService.list({ page: 1, page_size: 200 }), staleTime: 60000 });
  const users = usersData?.data?.items ?? [];
  const orgs = orgsData?.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => orgAssignmentsService.create({ user_id: parseInt(userId), organization_id: parseInt(orgId), assignment_type: type, notes: notes || undefined }),
    onSuccess: () => onSuccess(),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => setError(err?.response?.data?.message ?? "Failed to create assignment"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Assign User to Organization</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-muted-foreground">✕</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError(null); mutation.mutate(); }} className="p-6 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">User <span className="text-destructive">*</span></label>
            <select value={userId} onChange={e => setUserId(e.target.value)} required className={cn(inputClass, "w-full")}>
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization <span className="text-destructive">*</span></label>
            <select value={orgId} onChange={e => setOrgId(e.target.value)} required className={cn(inputClass, "w-full")}>
              <option value="">Select organization...</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assignment Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className={cn(inputClass, "w-full")}>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
              <option value="ASSESSOR">Assessor</option>
              <option value="OBSERVER">Observer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(inputClass, "resize-none w-full")} placeholder="Optional..." />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !userId || !orgId} className="gradient-gold text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OrgAssignmentsTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["org-assignments", page, search],
    queryFn: () => orgAssignmentsService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const paginatedData = data?.data;
  const items: OrgAssignment[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orgAssignmentsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-assignments"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search by user..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={cn(inputClass, "pl-9 w-full")} />
        </div>
        <button onClick={() => setShowCreate(true)} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "User", "Organization", "Type", "Notes", "Active", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>)}</tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">{search ? "No assignments match your search." : "No assignments found."}</td></tr>
              ) : (
                items.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.user_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.user_email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{a.organization_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary capitalize">{a.assignment_type.toLowerCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{a.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", a.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm("Remove this assignment?")) deleteMutation.mutate(a.id); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <AssignDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["org-assignments"] }); setShowCreate(false); }} />
      )}
    </div>
  );
}
