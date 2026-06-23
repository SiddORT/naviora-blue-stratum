"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, UserCheck, UserX, MoreHorizontal, X } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { listOrgUsers, createOrgUser, updateOrgUserStatus } from "@/services/org-portal.service";
import type { OrgUserListItem } from "@/types/org-portal.types";

const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  inactive: "#6B7280",
  suspended: "#EF4444",
};

const TYPE_LABELS: Record<string, string> = {
  ORG_ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  ASSESSOR: "Assessor",
};

interface InviteForm {
  email: string;
  full_name: string;
  user_type: string;
  phone: string;
}

const EMPTY_FORM: InviteForm = { email: "", full_name: "", user_type: "INSTRUCTOR", phone: "" };

export function OrgUsersView() {
  const { accessToken, user: me } = useOrgAuthStore();
  const [users, setUsers] = useState<OrgUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = me?.user_type === "ORG_ADMIN";

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listOrgUsers(accessToken, { page, page_size: 20, search: search || undefined });
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!accessToken || !form.email || !form.full_name) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createOrgUser(accessToken, form);
      setShowInvite(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (uuid: string, status: string) => {
    if (!accessToken) return;
    const next = status === "active" ? "inactive" : "active";
    await updateOrgUserStatus(accessToken, uuid, next);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{total} total users</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }}>
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Name", "Email", "Role", "Status", "Last Login", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.uuid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                         style={{ background: "rgba(212,166,58,0.12)", color: "#D4A63A" }}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{ background: "rgba(46,168,255,0.1)", color: "#2EA8FF" }}>
                    {TYPE_LABELS[u.user_type] ?? u.user_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: STATUS_COLORS[u.status] ?? "#6B7280" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[u.status] ?? "#6B7280" }} />
                    {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  {isAdmin && (
                    <button onClick={() => toggleStatus(u.uuid, u.status)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all"
                            style={{ color: u.status === "active" ? "#EF4444" : "#22C55E", background: u.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)" }}>
                      {u.status === "active" ? <><UserX className="w-3 h-3" />Deactivate</> : <><UserCheck className="w-3 h-3" />Activate</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6"
               style={{ background: "#141821", border: "1px solid rgba(212,166,58,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Invite User</h2>
              <button onClick={() => { setShowInvite(false); setForm(EMPTY_FORM); setFormError(null); }}
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {formError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400"
                   style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {formError}
              </div>
            )}
            <div className="space-y-4">
              {[
                { label: "Full Name", key: "full_name", type: "text", placeholder: "John Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "john@org.com" },
                { label: "Phone", key: "phone", type: "text", placeholder: "+1 555 0000" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
                  <input type={type} placeholder={placeholder}
                         value={form[key as keyof InviteForm]}
                         onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                         className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
                         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Role</label>
                <select value={form.user_type} onChange={e => setForm(f => ({ ...f, user_type: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ASSESSOR">Assessor</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowInvite(false); setForm(EMPTY_FORM); }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
              <button onClick={handleInvite} disabled={submitting || !form.email || !form.full_name}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }}>
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
