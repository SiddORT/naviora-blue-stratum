"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { candidatesService } from "@/services/candidates.service";
import { organizationsService } from "@/services/organizations.service";
import type { Candidate } from "@/types/common.types";
import { formatDate, getInitials } from "@/lib/utils";
import { PhoneInput, DIAL_CODES } from "@/components/shared/PhoneInput";

const statusColors: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-muted text-muted-foreground",
  suspended: "bg-amber-500/15 text-amber-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  username: string;
  phone: string;
  phone_dial: string;
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
  phone_dial: "+91",
  organization_id: "", rank_or_designation: "", seafarer_id: "",
  nationality: "", date_of_birth: "", notes: "", status: "active",
};

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

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
    mutationFn: ({ uuid, body }: { uuid: string; body: object }) => candidatesService.update(uuid, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidates"] }); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to update candidate."),
  });

  const openAdd = () => { setEditCandidate(null); setForm(EMPTY_FORM); setError(""); setModalOpen(true); };

  const openEdit = (c: Candidate) => {
    const dialEntry = DIAL_CODES.find(d => (c as any).phone_country_code === d.code) ?? DIAL_CODES[0];
    setEditCandidate(c);
    setForm({
      full_name: c.full_name,
      email: c.email,
      password: "",
      username: c.username ?? "",
      phone: c.phone ?? "",
      phone_dial: dialEntry.code,
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

  const setF = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body: Record<string, unknown> = {
      full_name: form.full_name,
      email: form.email,
      username: form.username || null,
      phone: form.phone || null,
      phone_country_code: form.phone_dial || null,
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, seafarer ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className={cn(inputClass, "w-auto")}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Candidate", "Seafarer ID", "Rank / Designation", "Status", "Last Login", "Created", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                : candidates.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                      {search || statusFilter ? "No candidates match your filters." : "No candidates found."}
                    </td>
                  </tr>
                )
                : candidates.map((c, idx) => (
                  <tr key={c.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                          {getInitials(c.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{c.full_name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.seafarer_id ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.rank_or_designation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {c.last_login ? formatDate(c.last_login) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination inside card */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-6 px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[88vh]"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                {editCandidate ? "Edit Candidate" : "Add Candidate"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {error && (
                <div className="px-3 py-2.5 rounded-lg text-sm bg-destructive/10 border border-destructive/30 text-destructive">
                  {error}
                </div>
              )}

              {/* Section: Identity */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pb-1.5 border-b border-border">
                  Identity
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full Name" required>
                    <input className={inputClass} value={form.full_name} onChange={setF("full_name")} required placeholder="e.g. John Smith" />
                  </FormField>
                  <FormField label="Email" required>
                    <input className={inputClass} type="email" value={form.email} onChange={setF("email")} required placeholder="candidate@example.com" readOnly={!!editCandidate} />
                  </FormField>
                  <FormField label={editCandidate ? "Password (leave blank to keep)" : "Password"} required={!editCandidate}>
                    <input className={inputClass} type="password" value={form.password} onChange={setF("password")} placeholder="Min 8 chars, upper, lower, digit" />
                  </FormField>
                  <FormField label="Username">
                    <input className={inputClass} value={form.username} onChange={setF("username")} placeholder="Optional login username" />
                  </FormField>
                </div>
              </div>

              {/* Section: Contact */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pb-1.5 border-b border-border">
                  Contact
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Phone">
                    <div className="relative">
                      <PhoneInput
                        value={form.phone}
                        dialCode={form.phone_dial}
                        onValueChange={v => setForm(f => ({ ...f, phone: v }))}
                        onDialCodeChange={v => setForm(f => ({ ...f, phone_dial: v }))}
                        placeholder="Phone number"
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Section: Maritime */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pb-1.5 border-b border-border">
                  Maritime Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Seafarer ID">
                    <input className={inputClass} value={form.seafarer_id} onChange={setF("seafarer_id")} placeholder="e.g. SF-123456" />
                  </FormField>
                  <FormField label="Rank / Designation">
                    <input className={inputClass} value={form.rank_or_designation} onChange={setF("rank_or_designation")} placeholder="e.g. Chief Officer" />
                  </FormField>
                  <FormField label="Nationality">
                    <input className={inputClass} value={form.nationality} onChange={setF("nationality")} placeholder="e.g. Philippines" />
                  </FormField>
                  <FormField label="Date of Birth">
                    <input className={inputClass} type="date" value={form.date_of_birth} onChange={setF("date_of_birth")} />
                  </FormField>
                </div>
              </div>

              {/* Section: Assignment */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 pb-1.5 border-b border-border">
                  Assignment
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Organization">
                    <select className={inputClass} value={form.organization_id} onChange={setF("organization_id")}>
                      <option value="">None / Independent</option>
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Status">
                    <select className={inputClass} value={form.status} onChange={setF("status")}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </FormField>
                </div>
                <div className="mt-4">
                  <FormField label="Notes">
                    <textarea
                      className={cn(inputClass, "min-h-[72px] resize-y")}
                      value={form.notes}
                      onChange={setF("notes")}
                      placeholder="Internal notes..."
                    />
                  </FormField>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <button type="button" onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={isPending}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                {isPending ? "Saving..." : editCandidate ? "Save Changes" : "Create Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
