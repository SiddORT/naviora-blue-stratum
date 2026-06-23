"use client";

import { useCallback, useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateListItem } from "@/types/certificate.types";
import { Download, Eye, RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react";

const STATUSES = ["", "Draft", "Issued", "Expired", "Revoked", "Suspended"];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Draft:     { bg: "#374151", text: "#9CA3AF" },
  Issued:    { bg: "#052e16", text: "#22C55E" },
  Expired:   { bg: "#431407", text: "#F97316" },
  Revoked:   { bg: "#450a0a", text: "#EF4444" },
  Suspended: { bg: "#422006", text: "#F59E0B" },
};

export function OrgCertificatesView() {
  const [certs, setCerts] = useState<CertificateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [analytics, setAnalytics] = useState<{ total_issued: number; total_expiring_soon: number; total_expired: number } | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [revokeModal, setRevokeModal] = useState<{ uuid: string; number: string } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (status) params.status = status;
      if (search) params.search = search;
      const [certsRes, analyticsRes] = await Promise.all([
        certificateService.orgList(params),
        certificateService.orgAnalytics(),
      ]);
      if (certsRes.success && certsRes.data) { setCerts(certsRes.data.items); setTotal(certsRes.data.total); }
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    } finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const doRevoke = async () => {
    if (!revokeModal) return;
    setActionLoading(true);
    try {
      await certificateService.orgRevoke(revokeModal.uuid, remarks);
      setRevokeModal(null); setRemarks("");
      load();
    } finally { setActionLoading(false); }
  };

  const pages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { label: "Total Issued", value: analytics.total_issued, color: "#22C55E" },
            { label: "Expiring Soon", value: analytics.total_expiring_soon, color: "#F59E0B" },
            { label: "Expired", value: analytics.total_expired, color: "#F97316" },
          ].map(s => (
            <div key={s.label} style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 0, background: "#141821", border: "1px solid #1E2430", borderRadius: 8, overflow: "hidden", flex: 1, minWidth: 240 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (setSearch(searchInput), setPage(1))}
            placeholder="Search by certificate number or candidate..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", color: "#F9FAFB", fontSize: 14 }}
          />
          <button onClick={() => { setSearch(searchInput); setPage(1); }}
            style={{ padding: "0 14px", background: "transparent", border: "none", cursor: "pointer", color: "#6B7280" }}>
            <Search size={16} />
          </button>
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || "All Statuses"}</option>)}
        </select>
        <button onClick={load} style={{ padding: "10px 14px", background: "#141821", border: "1px solid #1E2430", borderRadius: 8, color: "#9CA3AF", cursor: "pointer" }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2430" }}>
                {["Certificate #", "Candidate", "Assessment", "Type", "Issue Date", "Expiry", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>No certificates found for your organization</td></tr>
              ) : certs.map(c => {
                const sc = STATUS_COLOR[c.status] ?? { bg: "#1E2430", text: "#9CA3AF" };
                return (
                  <tr key={c.uuid} style={{ borderBottom: "1px solid #1E2430" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#0B0B0F"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#D4A63A", fontFamily: "monospace", whiteSpace: "nowrap" }}>{c.certificate_number}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <div style={{ color: "#F9FAFB" }}>{c.candidate_name ?? "—"}</div>
                      {c.candidate_email && <div style={{ color: "#6B7280", fontSize: 11 }}>{c.candidate_email}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB", maxWidth: 180 }}>{c.assessment_name ?? "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>{c.certificate_type}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB", whiteSpace: "nowrap" }}>{c.issue_date ? new Date(c.issue_date).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: c.expiry_date ? "#D1D5DB" : "#6B7280", whiteSpace: "nowrap" }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: sc.bg, color: sc.text, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{c.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {c.verification_url && (
                          <a href={`/verify-certificate/${c.certificate_number}`} target="_blank"
                            style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", textDecoration: "none" }}>
                            <Eye size={12} />
                          </a>
                        )}
                        {c.status === "Issued" && (
                          <a href={certificateService.orgDownloadUrl(c.uuid)} target="_blank"
                            style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", textDecoration: "none" }}>
                            <Download size={12} />
                          </a>
                        )}
                        {(c.status === "Issued" || c.status === "Suspended") && (
                          <button onClick={() => { setRevokeModal({ uuid: c.uuid, number: c.certificate_number }); setRemarks(""); }}
                            style={{ padding: "4px 10px", background: "#450a0a", border: "1px solid #991b1b", borderRadius: 6, color: "#EF4444", cursor: "pointer", fontSize: 12 }}>
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total certificates</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "6px 12px", background: "#141821", border: "1px solid #1E2430", borderRadius: 6, color: page === 1 ? "#374151" : "#9CA3AF", cursor: page === 1 ? "not-allowed" : "pointer" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: "#9CA3AF", lineHeight: "32px" }}>Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: "6px 12px", background: "#141821", border: "1px solid #1E2430", borderRadius: 6, color: page === pages ? "#374151" : "#9CA3AF", cursor: page === pages ? "not-allowed" : "pointer" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {revokeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 6 }}>Revoke Certificate</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              <span style={{ color: "#D4A63A", fontFamily: "monospace" }}>{revokeModal.number}</span>
            </p>
            <label style={{ display: "block", fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Reason</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
              style={{ width: "100%", background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setRevokeModal(null)}
                style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={doRevoke} disabled={actionLoading}
                style={{ padding: "8px 18px", background: "#EF4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                {actionLoading ? "Processing..." : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
