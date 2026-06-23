"use client";

import { useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateListItem } from "@/types/certificate.types";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { Award, Download, ExternalLink, RefreshCw } from "lucide-react";

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Draft:     { bg: "#374151",  text: "#9CA3AF", border: "#374151" },
  Issued:    { bg: "#052e16",  text: "#22C55E", border: "#166534" },
  Expired:   { bg: "#431407",  text: "#F97316", border: "#9a3412" },
  Revoked:   { bg: "#450a0a",  text: "#EF4444", border: "#991b1b" },
  Suspended: { bg: "#422006",  text: "#F59E0B", border: "#92400e" },
};

export function CandidateCertificatesView() {
  const [certs, setCerts] = useState<CertificateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await certificateService.myCertificates({ page: 1, page_size: 50 });
      if (res.success && res.data) { setCerts(res.data.items); setTotal(res.data.total); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <CandidatePortalLayout>
      <div style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", marginBottom: 4 }}>My Certificates</h1>
            <p style={{ fontSize: 14, color: "#6B7280" }}>View and download your competency certificates</p>
          </div>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#141821", border: "1px solid #1E2430", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6B7280" }}>Loading your certificates...</div>
        ) : certs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#141821", border: "1px solid #1E2430", borderRadius: 16 }}>
            <Award size={40} color="#374151" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, color: "#6B7280", marginBottom: 8 }}>No certificates yet</div>
            <div style={{ fontSize: 14, color: "#374151" }}>Complete an assessment to earn your first certificate</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {certs.map(c => {
              const sc = STATUS_COLOR[c.status] ?? STATUS_COLOR.Draft;
              const isValid = c.status === "Issued";
              const isExpired = c.status === "Expired";
              return (
                <div key={c.uuid} style={{
                  background: "#141821", border: `1px solid ${isValid ? "#166534" : "#1E2430"}`,
                  borderRadius: 14, padding: 22, position: "relative", overflow: "hidden",
                }}>
                  {/* Status stripe */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: sc.text, borderRadius: "14px 0 0 14px" }} />

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, paddingLeft: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <Award size={18} color={sc.text} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#F9FAFB" }}>
                          {c.assessment_name ?? c.certificate_type}
                        </span>
                        <span style={{ background: sc.bg, color: sc.text, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {c.status}
                        </span>
                      </div>

                      <div style={{ fontFamily: "monospace", fontSize: 14, color: "#D4A63A", marginBottom: 12 }}>
                        {c.certificate_number}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Type</div>
                          <div style={{ fontSize: 13, color: "#D1D5DB" }}>{c.certificate_type}</div>
                        </div>
                        {c.issue_date && (
                          <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Issued</div>
                            <div style={{ fontSize: 13, color: "#D1D5DB" }}>{new Date(c.issue_date).toLocaleDateString()}</div>
                          </div>
                        )}
                        {c.expiry_date && (
                          <div style={{ background: isExpired ? "#431407" : "#0B0B0F", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Expires</div>
                            <div style={{ fontSize: 13, color: isExpired ? "#F97316" : "#D1D5DB" }}>{new Date(c.expiry_date).toLocaleDateString()}</div>
                          </div>
                        )}
                        {c.score != null && (
                          <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Score</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: c.score >= 80 ? "#22C55E" : "#F59E0B" }}>{c.score}%</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
                      {isValid && (
                        <a href={certificateService.myDownloadUrl(c.uuid)} target="_blank"
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, fontSize: 13, textDecoration: "none", cursor: "pointer" }}>
                          <Download size={14} /> Download PDF
                        </a>
                      )}
                      {c.verification_url && (
                        <a href={`/verify-certificate/${c.certificate_number}`} target="_blank"
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#0c1a3a", border: "1px solid #1d4ed8", borderRadius: 8, color: "#2EA8FF", fontSize: 13, textDecoration: "none" }}>
                          <ExternalLink size={14} /> Verify
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {total > 0 && <div style={{ marginTop: 16, fontSize: 13, color: "#6B7280", textAlign: "center" }}>{total} certificate{total !== 1 ? "s" : ""} total</div>}
      </div>
    </CandidatePortalLayout>
  );
}
