"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { candidatesService } from "@/services/candidates.service";
import { organizationsService } from "@/services/organizations.service";
import type { Candidate } from "@/types/common.types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-muted text-muted-foreground",
  suspended: "bg-amber-500/15 text-amber-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  username: string;
  phone: string;
  organization_id: string;
  rank_or_designation: string;
  seafarer_id: string;
  nationality: string;
  date_of_birth: string;
  notes: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  full_name: "", email: "", password: "", username: "", phone: "",
  organization_id: "", rank_or_designation: "", seafarer_id: "",
  nationality: "", date_of_birth: "", notes: "", status: "active",
};

export function CandidatesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", page, search, statusFilter],
    queryFn: () =>
      candidatesService.list({ page, page_size: pageSize, search: search || undefined, status: statusFilter || undefined }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ["organizations-all"],
    queryFn: () => organizationsService.list({ page: 1, page_size: 200 }),
  });
  const orgs = (orgsData?.data?.items ?? []) as { id: number; name: string; code: string }[];

  const paginatedData = data?.data;
  const candidates: Candidate[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const createMutation = useMutation({
    mutationFn: (body: object) => candidatesService.create(body as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidates"] }); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to create candidate."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, body }: { uuid: string; body: object }) =>
      candidatesService.update(uuid, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidates"] }); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to update candidate."),
  });

  const openAdd = () => {
    setEditCandidate(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c: Candidate) => {
    setEditCandidate(c);
    setForm({
      full_name: c.full_name,
      email: c.email,
      password: "",
      username: c.username ?? "",
      phone: c.phone ?? "",
      organization_id: c.organization_id?.toString() ?? "",
      rank_or_designation: c.rank_or_designation ?? "",
      seafarer_id: c.seafarer_id ?? "",
      nationality: c.nationality ?? "",
      date_of_birth: c.date_of_birth ?? "",
      notes: c.notes ?? "",
      status: c.status,
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditCandidate(null); setForm(EMPTY_FORM); setError(""); };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body: Record<string, unknown> = {
      full_name: form.full_name,
      email: form.email,
      username: form.username || null,
      phone: form.phone || null,
      organization_id: form.organization_id ? parseInt(form.organization_id) : null,
      rank_or_designation: form.rank_or_designation || null,
      seafarer_id: form.seafarer_id || null,
      nationality: form.nationality || null,
      date_of_birth: form.date_of_birth || null,
      notes: form.notes || null,
      status: form.status,
    };
    if (!editCandidate) {
      if (!form.password) { setError("Password is required."); return; }
      body.password = form.password;
      createMutation.mutate(body);
    } else {
      if (form.password) body.password = form.password;
      updateMutation.mutate({ uuid: editCandidate.uuid, body });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className={cn(inputClass, "pl-9 w-60")}
              placeholder="Search name, email, seafarer ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className={cn(inputClass, "w-36")}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
        >
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seafarer ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank / Designation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                : candidates.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      No candidates found.
                    </td>
                  </tr>
                )
                : candidates.map((c, idx) => (
                  <tr key={c.uuid} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fromRow + idx}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.seafarer_id ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.rank_or_designation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.last_login ? formatDate(c.last_login) : "Never"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {fromRow}–{toRow} of {total}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            >Previous</button>
            <span className="px-3 py-1.5 text-foreground">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            >Next</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {editCandidate ? "Edit Candidate" : "Add Candidate"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-3 py-2.5 rounded-lg text-sm bg-destructive/10 border border-destructive/30 text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name <span className="text-primary">*</span></label>
                  <input className={inputClass} value={form.full_name} onChange={set("full_name")} required placeholder="e.g. John Smith" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email <span className="text-primary">*</span></label>
                  <input className={inputClass} type="email" value={form.email} onChange={set("email")} required placeholder="candidate@example.com" readOnly={!!editCandidate} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Password {editCandidate ? "(leave blank to keep)" : <span className="text-primary">*</span>}
                  </label>
                  <input className={inputClass} type="password" value={form.password} onChange={set("password")} placeholder="Min 8 chars, upper, lower, digit" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</label>
                  <input className={inputClass} value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seafarer ID</label>
                  <input className={inputClass} value={form.seafarer_id} onChange={set("seafarer_id")} placeholder="e.g. SF-123456" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rank / Designation</label>
                  <input className={inputClass} value={form.rank_or_designation} onChange={set("rank_or_designation")} placeholder="e.g. Chief Officer" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nationality</label>
                  <input className={inputClass} value={form.nationality} onChange={set("nationality")} placeholder="e.g. Philippines" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</label>
                  <input className={cn(inputClass, "w-full")} type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Organization</label>
                  <select className={inputClass} value={form.organization_id} onChange={set("organization_id")}>
                    <option value="">None / Independent</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                  <select className={inputClass} value={form.status} onChange={set("status")}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
                <textarea
                  className={cn(inputClass, "w-full min-h-[80px] resize-y")}
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}>
                  {isPending ? "Saving..." : editCandidate ? "Save Changes" : "Create Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
