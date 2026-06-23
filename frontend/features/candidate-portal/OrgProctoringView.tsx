"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Camera, RefreshCw } from "lucide-react";
import api from "@/services/api";
import { useOrgAuthStore } from "@/store/org-auth.store";

function orgApi() {
  const token = useOrgAuthStore.getState().accessToken;
  return {
    get: (url: string, params?: object) =>
      api.get(url, { headers: { Authorization: `Bearer ${token}` }, params }),
  };
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
  focus_violations: number;
  browser_name: string | null;
  operating_system: string | null;
  checked_in_at: string | null;
  created_at: string;
}

export function OrgProctoringView() {
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 20;

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await orgApi().get("/org/proctoring", {
        params: { page: p, page_size: PAGE_SIZE, search: s || undefined },
      });
      const body = res.data as { success: boolean; data?: { items: CheckinRow[]; total: number; pages: number } };
      if (body.success && body.data) {
        setRows(body.data.items);
        setTotal(body.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, ""); }, [load]);

  const handleSearch = (s: string) => { setSearch(s); setPage(1); load(1, s); };
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Proctoring</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Candidate check-in and integrity monitoring</p>
        </div>
        <button onClick={() => load(page, search)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2430", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color="#D4A63A" />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>Check-In Records</span>
            <span style={{ background: "#1E2430", borderRadius: 10, padding: "2px 10px", fontSize: 12, color: "#6B7280" }}>{total}</span>
          </div>
          <input
            value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search candidates..."
            style={{ background: "#0B0B0F", border: "1px solid #2A3441", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#F9FAFB", outline: "none", width: 220 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: 13 }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <Shield size={36} color="#374151" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: "#4B5563" }}>No check-in records</div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>Check-ins will appear here as candidates complete the pre-assessment process.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0B0B0F" }}>
                  {["Candidate", "Assessment", "Status", "Identity", "Rules", "Focus Events", "Browser", "Webcam", "Checked In"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.uuid} style={{ borderTop: "1px solid #0F1117" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#F9FAFB", fontWeight: 500 }}>{r.candidate_name ?? "—"}</div>
                      <div style={{ color: "#4B5563", fontSize: 11 }}>{r.candidate_email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#9CA3AF", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.assessment_name ?? "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {r.is_complete ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: "#10B98115", color: "#10B981" }}>
                          <CheckCircle size={10} /> Complete
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: "#F59E0B15", color: "#F59E0B" }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: r.identity_confirmed ? "#10B981" : "#EF4444", fontSize: 12 }}>{r.identity_confirmed ? "Yes" : "No"}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: r.rules_accepted ? "#10B981" : "#EF4444", fontSize: 12 }}>{r.rules_accepted ? "Yes" : "No"}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {r.focus_violations > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#F59E0B", fontSize: 12 }}>
                          <AlertTriangle size={12} />{r.focus_violations}
                        </span>
                      ) : <span style={{ color: "#374151", fontSize: 12 }}>0</span>}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6B7280" }}>{r.browser_name ?? "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {r.has_webcam ? <Camera size={14} color="#10B981" /> : <span style={{ color: "#374151", fontSize: 12 }}>—</span>}
                    </td>
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
