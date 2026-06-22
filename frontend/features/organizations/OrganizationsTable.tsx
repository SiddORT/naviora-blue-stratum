"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { organizationsService } from "@/services/organizations.service";
import { planService } from "@/services/plans.service";
import type { Organization } from "@/types/common.types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-muted text-muted-foreground",
  trial:     "bg-primary/15 text-primary",
  expired:   "bg-destructive/15 text-destructive",
  suspended: "bg-amber-500/15 text-amber-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

type FormState = {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  plan_id: string;
  max_users: string;
};

const EMPTY_FORM: FormState = {
  name: "", code: "", email: "", phone: "",
  address: "", website: "", plan_id: "", max_users: "10",
};

export function OrganizationsTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["organizations", page, search, statusFilter],
    queryFn: () =>
      organizationsService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans-active"],
    queryFn: () => planService.listAllActive(),
  });
  const plans = (plansData?.data ?? []) as { id: number; plan_name: string; plan_code: string }[];

  const paginatedData = data?.data;
  const orgs: Organization[] = (paginatedData?.items ?? []).filter((o) =>
    !statusFilter || o.subscription_status === statusFilter
  );
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const createMutation = useMutation({
    mutationFn: (body: object) => organizationsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      closeModal();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to create organization."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, body }: { uuid: string; body: object }) =>
      organizationsService.update(uuid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      closeModal();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to update organization."),
  });

  function openAdd() {
    setEditOrg(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(org: Organization) {
    setEditOrg(org);
    setForm({
      name: org.name,
      code: org.code,
      email: org.email ?? "",
      phone: "",
      address: "",
      website: "",
      plan_id: "",
      max_users: String(org.max_users),
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditOrg(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!editOrg && !form.code.trim()) { setError("Code is required."); return; }
    if (!editOrg && !/^[A-Z0-9_-]+$/.test(form.code.trim())) {
      setError("Code must be uppercase letters, numbers, underscores or hyphens only.");
      return;
    }
    const maxUsers = parseInt(form.max_users, 10);
    if (isNaN(maxUsers) || maxUsers < 1) { setError("Max users must be at least 1."); return; }

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      max_users: maxUsers,
      ...(form.email.trim()   && { email:   form.email.trim() }),
      ...(form.phone.trim()   && { phone:   form.phone.trim() }),
      ...(form.address.trim() && { address: form.address.trim() }),
      ...(form.website.trim() && { website: form.website.trim() }),
      ...(form.plan_id        && { plan_id: parseInt(form.plan_id, 10) }),
    };

    if (editOrg) {
      updateMutation.mutate({ uuid: editOrg.uuid, body });
    } else {
      createMutation.mutate({ ...body, code: form.code.trim().toUpperCase() });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Name", "Code", "Status", "Users", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No organizations match your filters." : "No organizations found."}
                  </td>
                </tr>
              ) : (
                orgs.map((org, idx) => (
                  <tr key={org.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{org.name}</div>
                      {org.email && <div className="text-xs text-muted-foreground">{org.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{org.code}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[org.subscription_status] ?? "bg-muted text-muted-foreground")}>
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {org.user_count} / {org.max_users}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(org.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(org)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-base font-semibold text-foreground">
                {editOrg ? "Edit Organization" : "New Organization"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && (
                <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Organization Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Acme Maritime Ltd"
                    className={cn(inputClass, "w-full")}
                  />
                </div>

                <div className={editOrg ? "col-span-2" : ""}>
                  {!editOrg && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Code <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.code}
                        onChange={(e) => set("code", e.target.value.toUpperCase())}
                        placeholder="e.g. ACME"
                        className={cn(inputClass, "w-full font-mono")}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">Uppercase letters, numbers, _ or - only. Cannot be changed later.</p>
                    </div>
                  )}
                </div>

                {!editOrg && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Max Users</label>
                    <input
                      type="number"
                      min={1}
                      value={form.max_users}
                      onChange={(e) => set("max_users", e.target.value)}
                      className={cn(inputClass, "w-full")}
                    />
                  </div>
                )}

                {editOrg && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Max Users</label>
                    <input
                      type="number"
                      min={1}
                      value={form.max_users}
                      onChange={(e) => set("max_users", e.target.value)}
                      className={cn(inputClass, "w-full")}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Plan</label>
                  <select value={form.plan_id} onChange={(e) => set("plan_id", e.target.value)} className={cn(inputClass, "w-full")}>
                    <option value="">No plan assigned</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.plan_name} ({p.plan_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="contact@example.com"
                    className={cn(inputClass, "w-full")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={cn(inputClass, "w-full")}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Website</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://example.com"
                    className={cn(inputClass, "w-full")}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Address</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street, City, Country"
                    className={cn(inputClass, "w-full resize-none")}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-opacity"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                {isPending ? "Saving..." : editOrg ? "Save Changes" : "Create Organization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
