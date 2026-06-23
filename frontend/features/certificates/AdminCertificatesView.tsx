"use client";

import { useCallback, useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateListItem } from "@/types/certificate.types";
import { Award, Download, Search, RefreshCw, ChevronLeft, ChevronRight, Eye } from "lucide-react";

const STATUSES = ["", "Draft", "Issued", "Expired", "Revoked", "Suspended"];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Draft:     { bg: "#374151", text: "#9CA3AF" },
  Issued:    { bg: "#052e16", text: "#22C55E" },
  Expired:   { bg: "#431407", text: "#F97316" },
  Revoked:   { bg: "#450a0a", text: "#EF4444" },
  Suspended: { bg: "#422006", text: "#F59E0B" },
};

function Badge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { bg: "#1E2430", text: "#9CA3AF" };
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

export function AdminCertificatesView() {
  const [certs, setCerts] = useState<CertificateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: "revoke" | "suspend" | "reinstate" | "renew"; uuid: string; number: string } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await certificateService.list(params);
      if (res.success && res.data) {
        setCerts(res.data.items);
        setTotal(res.data.total);
      }
    } finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const doAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal.type === "revoke")    await certificateService.revoke(actionModal.uuid, remarks);
      if (actionModal.type === "suspend")   await certificateService.suspend(actionModal.uuid, remarks);
      if (actionModal.type === "reinstate") await certificateService.reinstate(actionModal.uuid);
      if (actionModal.type === "renew")     await certificateService.renew(actionModal.uuid, remarks);
      setActionModal(null);
      setRemarks("");
      load();
    } finally { setActionLoading(false); }
  };

  const pages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 0, background: "#141821", border: "1px solid #1E2430", borderRadius: 8, overflow: "hidden", flex: 1, minWidth: 260 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by certificate number or candidate..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", color: "#F9FAFB", fontSize: 14 }}
          />
          <button onClick={handleSearch} style={{ padding: "0 14px", background: "transparent", border: "none", cursor: "pointer", color: "#6B7280" }}>
            <Search size={16} />
          </button>
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }}
        >
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
                {["Certificate #", "Candidate", "Assessment", "Type", "Issue Date", "Expiry", "Score", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 14 }}>Loading...</td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 14 }}>No certificates found</td></tr>
              ) : certs.map(c => (
                <tr key={c.uuid} style={{ borderBottom: "1px solid #1E2430" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#0B0B0F"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                >
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#D4A63A", fontFamily: "monospace", whiteSpace: "nowrap" }}>{c.certificate_number}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <div style={{ color: "#F9FAFB" }}>{c.candidate_name ?? "—"}</div>
                    {c.candidate_email && <div style={{ color: "#6B7280", fontSize: 11 }}>{c.candidate_email}</div>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB", maxWidth: 200 }}>{c.assessment_name ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>{c.certificate_type}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB", whiteSpace: "nowrap" }}>{c.issue_date ? new Date(c.issue_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: c.expiry_date ? "#D1D5DB" : "#6B7280", whiteSpace: "nowrap" }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB" }}>{c.score != null ? `${c.score}%` : "—"}</td>
                  <td style={{ padding: "12px 16px" }}><Badge status={c.status} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {c.verification_url && (
                        <a href={`/verify-certificate/${c.certificate_number}`} target="_blank" style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", cursor: "pointer", fontSize: 12, textDecoration: "none" }}>
                          <Eye size={12} />
                        </a>
                      )}
                      {c.status === "Issued" && (
                        <a href={certificateService.downloadUrl(c.uuid)} target="_blank" style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", cursor: "pointer", fontSize: 12, textDecoration: "none" }}>
                          <Download size={12} />
                        </a>
                      )}
                      {(c.status === "Issued") && (
                        <button onClick={() => { setActionModal({ type: "suspend", uuid: c.uuid, number: c.certificate_number }); setRemarks(""); }}
                          style={{ padding: "4px 10px", background: "#422006", border: "1px solid #92400e", borderRadius: 6, color: "#F59E0B", cursor: "pointer", fontSize: 12 }}>
                          Suspend
                        </button>
                      )}
                      {(c.status === "Issued" || c.status === "Suspended") && (
                        <button onClick={() => { setActionModal({ type: "revoke", uuid: c.uuid, number: c.certificate_number }); setRemarks(""); }}
                          style={{ padding: "4px 10px", background: "#450a0a", border: "1px solid #991b1b", borderRadius: 6, color: "#EF4444", cursor: "pointer", fontSize: 12 }}>
                          Revoke
                        </button>
                      )}
                      {c.status === "Suspended" && (
                        <button onClick={() => { setActionModal({ type: "reinstate", uuid: c.uuid, number: c.certificate_number }); setRemarks(""); }}
                          style={{ padding: "4px 10px", background: "#052e16", border: "1px solid #166534", borderRadius: 6, color: "#22C55E", cursor: "pointer", fontSize: 12 }}>
                          Reinstate
                        </button>
                      )}
                      {(c.status === "Issued" || c.status === "Expired") && (
                        <button onClick={() => { setActionModal({ type: "renew", uuid: c.uuid, number: c.certificate_number }); setRemarks(""); }}
                          style={{ padding: "4px 10px", background: "#0c1a3a", border: "1px solid #1d4ed8", borderRadius: 6, color: "#2EA8FF", cursor: "pointer", fontSize: 12 }}>
                          Renew
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{total} total certificates</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "6px 12px", background: "#141821", border: "1px solid #1E2430", borderRadius: 6, color: page === 1 ? "#374151" : "#9CA3AF", cursor: page === 1 ? "not-allowed" : "pointer" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: "6px 12px", background: "#141821", border: "1px solid #1E2430", borderRadius: 6, color: page === pages ? "#374151" : "#9CA3AF", cursor: page === pages ? "not-allowed" : "pointer" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Action modal */}
      {actionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 6, textTransform: "capitalize" }}>
              {actionModal.type} Certificate
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Certificate: <span style={{ color: "#D4A63A", fontFamily: "monospace" }}>{actionModal.number}</span>
            </p>
            {actionModal.type !== "reinstate" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Remarks / Reason</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Enter reason..."
                  style={{ width: "100%", background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setActionModal(null)}
                style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={doAction} disabled={actionLoading}
                style={{ padding: "8px 18px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                {actionLoading ? "Processing..." : `Confirm ${actionModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
