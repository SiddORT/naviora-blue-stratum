"use client";

import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { listOrgCandidates, createOrgCandidate, updateOrgCandidateStatus } from "@/services/org-portal.service";
import type { OrgCandidateListItem } from "@/types/org-portal.types";

const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  inactive: "#6B7280",
  suspended: "#EF4444",
};

interface CandidateForm {
  email: string;
  full_name: string;
  phone: string;
  nationality: string;
  rank_or_designation: string;
  seafarer_id: string;
}

const EMPTY_FORM: CandidateForm = { email: "", full_name: "", phone: "", nationality: "", rank_or_designation: "", seafarer_id: "" };

export function OrgCandidatesView() {
  const { accessToken } = useOrgAuthStore();
  const [candidates, setCandidates] = useState<OrgCandidateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CandidateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listOrgCandidates(accessToken, { page, page_size: PAGE_SIZE, search: search || undefined });
      setCandidates(res.items);
      setTotal(res.total);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!accessToken || !form.email || !form.full_name) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createOrgCandidate(accessToken, form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create candidate");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (uuid: string, status: string) => {
    if (!accessToken) return;
    const next = status === "active" ? "inactive" : "active";
    try { await updateOrgCandidateStatus(accessToken, uuid, next); load(); } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Candidates</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{total} total candidates</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Import (Coming Soon)
          </button>
          <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }}>
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
        <input type="text" placeholder="Search by name, email, or seafarer ID..."
               value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
               className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
               style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.08)" }} />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Name", "Email", "Rank", "Seafarer ID", "Nationality", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading...</td></tr>
            ) : candidates.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No candidates found</td></tr>
            ) : candidates.map(c => (
              <tr key={c.uuid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                         style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-medium">{c.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{c.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {c.rank_or_designation ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {c.seafarer_id ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {c.nationality ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: STATUS_COLORS[c.status] ?? "#6B7280" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[c.status] ?? "#6B7280" }} />
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(c.uuid, c.status)}
                          className="text-[11px] px-2 py-1 rounded transition-all"
                          style={{ color: c.status === "active" ? "#EF4444" : "#22C55E", background: c.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)" }}>
                    {c.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Page {page} of {totalPages} — {total} records
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded disabled:opacity-40 transition-all"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded disabled:opacity-40 transition-all"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6"
               style={{ background: "#141821", border: "1px solid rgba(212,166,58,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Add Candidate</h2>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormError(null); }}
                      style={{ color: "rgba(255,255,255,0.4)" }}><X className="w-4 h-4" /></button>
            </div>
            {formError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400"
                   style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {formError}
              </div>
            )}
            <div className="space-y-4">
              {[
                { label: "Full Name *", key: "full_name", type: "text", placeholder: "John Smith" },
                { label: "Email *", key: "email", type: "email", placeholder: "john@example.com" },
                { label: "Phone", key: "phone", type: "text", placeholder: "+1 555 0000" },
                { label: "Nationality", key: "nationality", type: "text", placeholder: "Filipino" },
                { label: "Maritime Rank", key: "rank_or_designation", type: "text", placeholder: "Chief Officer" },
                { label: "Seafarer ID", key: "seafarer_id", type: "text", placeholder: "SF-0001" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
                  <input type={type} placeholder={placeholder}
                         value={form[key as keyof CandidateForm]}
                         onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                         className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
                         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={submitting || !form.email || !form.full_name}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }}>
                {submitting ? "Creating..." : "Create Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
