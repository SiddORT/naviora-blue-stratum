"use client";

import { useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateAnalytics } from "@/types/certificate.types";
import { Award, TrendingUp, AlertTriangle, XCircle, PauseCircle, RefreshCw } from "lucide-react";

export function AdminCertAnalyticsView() {
  const [data, setData] = useState<CertificateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await certificateService.analytics();
      if (res.success && res.data) setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const STATS = data ? [
    { label: "Total Issued", value: data.total_issued, icon: Award, color: "#22C55E", bg: "#052e16" },
    { label: "Active",       value: data.total_active, icon: TrendingUp, color: "#2EA8FF", bg: "#0c1a3a" },
    { label: "Expiring Soon", value: data.total_expiring_soon, icon: AlertTriangle, color: "#F59E0B", bg: "#422006" },
    { label: "Expired",      value: data.total_expired, icon: XCircle, color: "#F97316", bg: "#431407" },
    { label: "Revoked",      value: data.total_revoked, icon: XCircle, color: "#EF4444", bg: "#450a0a" },
    { label: "Suspended",    value: data.total_suspended, icon: PauseCircle, color: "#F59E0B", bg: "#422006" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#141821", border: "1px solid #1E2430", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6B7280" }}>Loading analytics...</div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6B7280" }}>No data available</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={18} color={s.color} />
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          {/* Recent issuances */}
          {data.recent_issuances.length > 0 && (
            <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2430" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB" }}>Recent Issuances</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E2430" }}>
                    {["Certificate #", "Candidate", "Issue Date", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_issuances.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1E2430" }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#D4A63A", fontFamily: "monospace" }}>{r.certificate_number}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#D1D5DB" }}>{r.candidate_name ?? "—"}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#9CA3AF" }}>{r.issue_date ? new Date(r.issue_date).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#052e16", color: "#22C55E" }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
