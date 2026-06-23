"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Eye, AlertTriangle, WifiOff, Activity, RefreshCw } from "lucide-react";
import api from "@/services/api";
import type { ApiResponse } from "@/types/api.types";
import { useAuthStore } from "@/store/auth.store";

interface ProctoringStats {
  checkins_today: number;
  total_checkins: number;
  focus_violations: number;
  disconnected_sessions: number;
  total_integrity_events: number;
}

interface CheckinRow {
  uuid: string;
  candidate_name: string | null;
  candidate_email: string | null;
  assessment_name: string | null;
  identity_confirmed: boolean;
  rules_accepted: boolean;
  is_complete: boolean;
  has_webcam: boolean;
  browser_name: string | null;
  operating_system: string | null;
  device_type: string | null;
  ip_address: string | null;
  checked_in_at: string | null;
  created_at: string;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#F9FAFB", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export function AdminProctoringView() {
  const token = useAuthStore((s) => s.accessToken);
  const [stats, setStats] = useState<ProctoringStats | null>(null);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 20;

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        api.get<ApiResponse<ProctoringStats>>("/proctoring/summary", { headers: { Authorization: `Bearer ${token}` } }),
        api.get<ApiResponse<{ items: CheckinRow[]; total: number }>>("/proctoring/checkins", {
          params: { page: p, page_size: PAGE_SIZE, search: s || undefined },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data!);
      if (listRes.data.success && listRes.data.data) {
        setCheckins(listRes.data.data.items);
        setTotal(listRes.data.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(1);
    load(1, s);
  };

  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Proctoring</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Assessment integrity monitoring and check-in records</p>
        </div>
        <button onClick={() => load(page, search)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <StatCard label="Check-Ins Today"      value={stats.checkins_today}           icon={Shield}       color="#10B981" />
          <StatCard label="Total Check-Ins"       value={stats.total_checkins}           icon={Eye}          color="#2EA8FF" />
          <StatCard label="Focus Violations"      value={stats.focus_violations}         icon={AlertTriangle} color="#F59E0B" />
          <StatCard label="Disconnections"        value={stats.disconnected_sessions}    icon={WifiOff}      color="#EF4444" />
          <StatCard label="Integrity Events"      value={stats.total_integrity_events}   icon={Activity}     color="#8B5CF6" />
        </div>
      )}

      {/* Check-ins table */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2430", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Check-In Records</h2>
          <input
            value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search candidates..."
            style={{ background: "#0B0B0F", border: "1px solid #2A3441", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#F9FAFB", outline: "none", width: 220 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: 13 }}>Loading...</div>
        ) : checkins.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#4B5563", fontSize: 13 }}>No check-in records found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0B0B0F" }}>
                  {["Candidate", "Assessment", "Identity", "Rules", "Webcam", "Browser", "OS", "IP Address", "Checked In"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checkins.map((r) => (
                  <tr key={r.uuid} style={{ borderTop: "1px solid #0F1117" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#F9FAFB", fontWeight: 500 }}>{r.candidate_name ?? "—"}</div>
                      <div style={{ color: "#4B5563", fontSize: 11 }}>{r.candidate_email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#9CA3AF", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.assessment_name ?? "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: r.identity_confirmed ? "#10B98115" : "#EF444415", color: r.identity_confirmed ? "#10B981" : "#EF4444" }}>
                        {r.identity_confirmed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: r.rules_accepted ? "#10B98115" : "#EF444415", color: r.rules_accepted ? "#10B981" : "#EF4444" }}>
                        {r.rules_accepted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: r.has_webcam ? "#10B981" : "#374151", fontSize: 12 }}>{r.has_webcam ? "Yes" : "—"}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6B7280" }}>{r.browser_name ?? "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6B7280" }}>{r.operating_system ?? "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#4B5563", fontFamily: "monospace", fontSize: 11 }}>{r.ip_address ?? "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#4B5563", whiteSpace: "nowrap", fontSize: 12 }}>
                      {r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1E2430", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{total} records</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p, search); }} disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: page === 1 ? "#374151" : "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13 }}>Prev</button>
              <span style={{ padding: "6px 12px", fontSize: 13, color: "#6B7280" }}>{page}/{pages}</span>
              <button onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(p, search); }} disabled={page === pages}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: page === pages ? "#374151" : "#6B7280", cursor: page === pages ? "not-allowed" : "pointer", fontSize: 13 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
