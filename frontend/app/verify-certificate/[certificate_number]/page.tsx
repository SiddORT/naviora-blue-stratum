"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, CheckCircle2, XCircle, AlertTriangle, Clock, Shield } from "lucide-react";
import type { VerifyResult } from "@/types/certificate.types";

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  Issued:    { icon: CheckCircle2, color: "#22C55E", bg: "#052e16", label: "Valid Certificate" },
  Expired:   { icon: Clock,        color: "#F97316", bg: "#431407", label: "Certificate Expired" },
  Revoked:   { icon: XCircle,      color: "#EF4444", bg: "#450a0a", label: "Certificate Revoked" },
  Suspended: { icon: AlertTriangle, color: "#F59E0B", bg: "#422006", label: "Certificate Suspended" },
  Draft:     { icon: AlertTriangle, color: "#6B7280", bg: "#1E2430", label: "Not Yet Issued" },
};

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateNumber = decodeURIComponent(params.certificate_number as string);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/verify/${encodeURIComponent(certificateNumber)}`);
        const json = await res.json();
        if (json.success && json.data) setResult(json.data);
        else setError(json.message || "Certificate not found");
      } catch {
        setError("Unable to verify certificate. Please try again.");
      } finally { setLoading(false); }
    };
    verify();
  }, [certificateNumber]);

  const cfg = result ? (STATUS_CONFIG[result.status ?? "Draft"] ?? STATUS_CONFIG.Draft) : null;
  const Icon = cfg?.icon ?? Award;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B0F", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1E2430", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Shield size={22} color="#D4A63A" />
        <span style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB" }}>Naviora Certificate Verification</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>Blue Stratum Maritime Platform</span>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 580 }}>
          {/* Certificate number */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>Verification request for</div>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#D4A63A", letterSpacing: 2 }}>
              {certificateNumber}
            </div>
          </div>

          {loading && (
            <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#6B7280" }}>Verifying certificate...</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ background: "#141821", border: "1px solid #450a0a", borderRadius: 16, padding: 40, textAlign: "center" }}>
              <XCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>Verification Failed</div>
              <div style={{ fontSize: 14, color: "#9CA3AF" }}>{error}</div>
            </div>
          )}

          {!loading && result && cfg && (
            <div style={{ background: "#141821", border: `1px solid ${cfg.color}30`, borderRadius: 16, overflow: "hidden" }}>
              {/* Status banner */}
              <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.color}30`, padding: "20px 28px", display: "flex", alignItems: "center", gap: 14 }}>
                <Icon size={32} color={cfg.color} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                    {result.verification_status === "Valid" ? "This certificate is authentic and valid." : "This certificate is not currently valid."}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <InfoField label="Certificate Holder" value={result.candidate_name ?? "—"} />
                  <InfoField label="Certificate Type" value={result.certificate_type ?? "—"} />
                  <InfoField label="Assessment / Programme" value={result.assessment_name ?? "—"} />
                  <InfoField label="Issuing Organization" value={result.organization_name ?? "Naviora"} />
                  <InfoField label="Issue Date" value={result.issue_date ? new Date(result.issue_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
                  <InfoField label="Expiry Date" value={result.expiry_date ? new Date(result.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "No Expiry"} isWarning={result.status === "Expired"} />
                  {result.score != null && <InfoField label="Assessment Score" value={`${result.score}%`} highlight />}
                  <InfoField label="Current Status" value={result.status ?? "Unknown"} statusColor={cfg.color} statusBg={cfg.bg} />
                </div>

                {/* Validity stamp */}
                <div style={{ borderTop: "1px solid #1E2430", paddingTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  <Shield size={14} color="#6B7280" />
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    Verified on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC by Naviora Certificate Engine
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #1E2430", padding: "14px 24px", textAlign: "center", fontSize: 12, color: "#374151" }}>
        Blue Stratum — Naviora Maritime Assessment Platform
      </footer>
    </div>
  );
}

function InfoField({ label, value, highlight, isWarning, statusColor, statusBg }: {
  label: string; value: string; highlight?: boolean; isWarning?: boolean;
  statusColor?: string; statusBg?: string;
}) {
  return (
    <div style={{ background: "#0B0B0F", borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      {statusColor ? (
        <span style={{ background: statusBg, color: statusColor, padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{value}</span>
      ) : (
        <div style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: isWarning ? "#F97316" : highlight ? "#D4A63A" : "#F9FAFB" }}>{value}</div>
      )}
    </div>
  );
}
