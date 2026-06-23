"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orgSessionsService } from "@/services/org-sessions.service";
import type { RuntimeSession } from "@/services/runtime.service";
import { RefreshCw, Eye } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  Pending: "#6B7280", Launching: "#2EA8FF", Running: "#22C55E",
  Completed: "#10B981", Failed: "#EF4444", Cancelled: "#F59E0B", "Timed Out": "#F97316",
};

const STATUSES = ["", "Pending", "Launching", "Running", "Completed", "Failed", "Cancelled"];
const MODES = ["", "CLOUD_API", "DESKTOP_OFFLINE", "MANUAL"];

export function OrgSessionsView() {
  const router = useRouter();
  const [sessions, setSessions] = useState<RuntimeSession[]>([]);
  const [stats, setStats] = useState<{ total: number; by_status: Record<string, number> } | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (status) params.status = status;
      if (mode) params.runtime_mode = mode;
      const [res, statsRes] = await Promise.all([
        orgSessionsService.listSessions(params),
        orgSessionsService.getStats(),
      ]);
      if (res.success) { setSessions(res.data!.items); setTotal(res.data!.total); }
      if (statsRes.success) setStats(statsRes.data!);
    } finally { setLoading(false); }
  }, [page, status, mode]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);
  const selectStyle = { background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 6, padding: "6px 10px", color: "#F9FAFB", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats pills */}
      {stats && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total", val: stats.total, color: "#D4A63A" },
            { label: "Running", val: stats.by_status["Running"] ?? 0, color: "#22C55E" },
            { label: "Completed", val: stats.by_status["Completed"] ?? 0, color: "#10B981" },
            { label: "Failed", val: stats.by_status["Failed"] ?? 0, color: "#EF4444" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 8, padding: "10px 18px", minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s || "All Statuses"}</option>)}
        </select>
        <select value={mode} onChange={e => { setMode(e.target.value); setPage(1); }} style={selectStyle}>
          {MODES.map(m => <option key={m} value={m}>{m || "All Modes"}</option>)}
        </select>
        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2430" }}>
              {["Reference", "Candidate", "Campaign", "Vendor", "Mode", "Status", "Started", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "12px 16px", color: "#6B7280", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>No sessions found</td></tr>
            ) : sessions.map(s => (
              <tr key={s.uuid} style={{ borderBottom: "1px solid #1E2430" }}>
                <td style={{ padding: "12px 16px", color: "#D4A63A", fontFamily: "monospace", fontSize: 12 }}>{s.session_reference}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ color: "#F9FAFB" }}>{s.candidate_name ?? "—"}</div>
                  {s.candidate_email && <div style={{ color: "#6B7280", fontSize: 11 }}>{s.candidate_email}</div>}
                </td>
                <td style={{ padding: "12px 16px", color: "#D1D5DB" }}>{s.campaign_name ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#D1D5DB" }}>{s.vendor_name ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "#1E2430", color: "#9CA3AF" }}>{s.runtime_mode}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUS_COLOR[s.status] ?? "#6B7280"}20`, color: STATUS_COLOR[s.status] ?? "#6B7280" }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: 12 }}>
                  {s.started_at ? new Date(s.started_at).toLocaleString() : new Date(s.created_at).toLocaleString()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => router.push(`/org/sessions/${s.uuid}`)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#2EA8FF", cursor: "pointer", fontSize: 12 }}>
                    <Eye size={12} />View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total</span>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 12 }}>Prev</button>
          <span style={{ fontSize: 13, color: "#D1D5DB" }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 12 }}>Next</button>
        </div>
      )}
    </div>
  );
}
