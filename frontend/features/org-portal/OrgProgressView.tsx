"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Search, ChevronLeft, ChevronRight, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getProgress, getProgressSummary } from "@/services/campaign.service";
import type { ProgressRow, ProgressSummary } from "@/types/campaign.types";

const STATUS_COLORS: Record<string, string> = {
  Assigned: "#2EA8FF", "In Progress": "#F59E0B", Completed: "#A78BFA",
  Passed: "#22C55E", Failed: "#EF4444", Expired: "#9CA3AF", Cancelled: "#6B7280",
};
const STATUS_BG: Record<string, string> = {
  Assigned: "rgba(46,168,255,0.12)", "In Progress": "rgba(245,158,11,0.12)",
  Completed: "rgba(167,139,250,0.12)", Passed: "rgba(34,197,94,0.12)",
  Failed: "rgba(239,68,68,0.12)", Expired: "rgba(156,163,175,0.12)", Cancelled: "rgba(107,114,128,0.12)",
};

export function OrgProgressView() {
  const { accessToken } = useOrgAuthStore();
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        getProgress(accessToken, { page, page_size: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined }),
        getProgressSummary(accessToken),
      ]);
      setRows(res.items);
      setTotal(res.total);
      setSummary(s);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Candidate Progress</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Track assessment progress across all campaigns
        </p>
      </div>

      {/* Summary widgets */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: summary.total, icon: AlertCircle, color: "#2EA8FF" },
            { label: "In Progress", value: summary.in_progress, icon: Clock, color: "#F59E0B" },
            { label: "Passed", value: summary.passed, icon: CheckCircle2, color: "#22C55E" },
            { label: "Failed", value: summary.failed, icon: XCircle, color: "#EF4444" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rates */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Pass Rate", value: summary.pass_rate, color: "#22C55E" },
            { label: "Completion Rate", value: summary.completion_rate, color: "#D4A63A" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color }}>{value}%</p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input type="text" placeholder="Search by candidate name or email..."
                 value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                 className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                 style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Filter className="w-3.5 h-3.5 ml-2" style={{ color: "rgba(255,255,255,0.3)" }} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  className="text-sm bg-transparent focus:outline-none pr-2 py-1"
                  style={{ color: statusFilter ? "#D4A63A" : "rgba(255,255,255,0.4)" }}>
            <option value="">All Statuses</option>
            {["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Candidate", "Assessment", "Campaign", "Status", "Attempts", "Score", "Assigned", "Completed"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No progress data yet</p>
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.assignment_uuid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{r.candidate_name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {r.rank_or_designation ?? r.candidate_email}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {r.assessment_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {r.campaign_name}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: STATUS_BG[r.assignment_status], color: STATUS_COLORS[r.assignment_status] }}>
                    {r.assignment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {r.attempt_count}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: r.final_score != null ? (r.result_status === "Passed" ? "#22C55E" : "#EF4444") : "rgba(255,255,255,0.45)" }}>
                  {r.final_score != null ? `${r.final_score}%` : "—"}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {r.assigned_at ? new Date(r.assigned_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Page {page} of {totalPages} — {total} records
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded disabled:opacity-40"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded disabled:opacity-40"
                      style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
