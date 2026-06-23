"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { runtimeService, type SessionDetail } from "@/services/runtime.service";
import { ArrowLeft, XCircle, CheckCircle, AlertCircle, Info } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  Pending: "#6B7280", Launching: "#2EA8FF", Running: "#22C55E",
  Completed: "#10B981", Failed: "#EF4444", Cancelled: "#F59E0B", "Timed Out": "#F97316",
};
const LOG_COLOR: Record<string, string> = { Info: "#2EA8FF", Warning: "#F59E0B", Error: "#EF4444" };

export function RuntimeSessionDetailView({ uuid }: { uuid: string }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualResult, setManualResult] = useState({ result: "Pass", score: "", remarks: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await runtimeService.getSession(uuid);
    if (res.success) setSession(res.data!);
    setLoading(false);
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!confirm("Cancel this session?")) return;
    setCancelling(true);
    await runtimeService.cancelSession(uuid);
    setCancelling(false);
    load();
  };

  const handleManual = async () => {
    setSubmitting(true);
    await runtimeService.submitManualResult(uuid, {
      result: manualResult.result,
      score: manualResult.score ? Number(manualResult.score) : undefined,
      remarks: manualResult.remarks || undefined,
    });
    setSubmitting(false);
    setShowManual(false);
    load();
  };

  if (loading) return <div style={{ color: "#6B7280", fontSize: 14, padding: 40 }}>Loading...</div>;
  if (!session) return <div style={{ color: "#EF4444", fontSize: 14, padding: 40 }}>Session not found.</div>;

  const field = (label: string, value: unknown) => (
    <div key={label}>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#F9FAFB" }}>{String(value ?? "—")}</div>
    </div>
  );

  const inputStyle = { width: "100%", background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 6, padding: "8px 12px", color: "#F9FAFB", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <button onClick={() => router.push("/admin/runtime/sessions")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, padding: 0 }}>
        <ArrowLeft size={14} />Back to Sessions
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#D4A63A" }}>{session.session_reference}</div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>{session.uuid}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: `${STATUS_COLOR[session.status] ?? "#6B7280"}20`, color: STATUS_COLOR[session.status] ?? "#6B7280" }}>
            {session.status}
          </span>
          {!["Completed", "Cancelled", "Failed"].includes(session.status) && (
            <>
              <button onClick={() => setShowManual(true)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #10B981", background: "transparent", color: "#10B981", cursor: "pointer", fontSize: 13 }}>
                Manual Result
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #EF4444", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 13 }}>
                {cancelling ? "Cancelling..." : "Cancel Session"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB", marginBottom: 16 }}>Session Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {field("Candidate", session.candidate_name)}
          {field("Email", session.candidate_email)}
          {field("Organization", session.organization_name)}
          {field("Campaign", session.campaign_name)}
          {field("Assessment", session.assessment_name)}
          {field("Exercise", session.exercise_name)}
          {field("Variant", session.variant_name)}
          {field("Runtime Mode", session.runtime_mode)}
          {field("Vendor", session.vendor_name)}
          {field("Started", session.started_at ? new Date(session.started_at).toLocaleString() : "—")}
          {field("Completed", session.completed_at ? new Date(session.completed_at).toLocaleString() : "—")}
          {field("Launched By", session.launched_by)}
        </div>
        {session.failure_reason && (
          <div style={{ marginTop: 16, padding: 12, background: "#EF444410", borderRadius: 6, border: "1px solid #EF444430" }}>
            <div style={{ fontSize: 11, color: "#EF4444", marginBottom: 4 }}>Failure Reason</div>
            <div style={{ fontSize: 13, color: "#F9FAFB" }}>{session.failure_reason}</div>
          </div>
        )}
        {session.raw_result && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Result</div>
            <pre style={{ background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 6, padding: 12, fontSize: 12, color: "#D1D5DB", overflowX: "auto" }}>
              {JSON.stringify(session.raw_result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Logs */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB", marginBottom: 16 }}>Event Log ({session.logs.length})</h3>
        {session.logs.length === 0 ? (
          <div style={{ color: "#6B7280", fontSize: 13 }}>No events recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {session.logs.map((lg, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#0B0B0F", borderRadius: 6, borderLeft: `3px solid ${LOG_COLOR[lg.log_level] ?? "#6B7280"}` }}>
                <div style={{ fontSize: 11, color: "#6B7280", whiteSpace: "nowrap", minWidth: 130 }}>
                  {new Date(lg.created_at).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: LOG_COLOR[lg.log_level] ?? "#6B7280", minWidth: 60 }}>{lg.log_level}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#F9FAFB", marginBottom: 2 }}>{lg.event_type}</div>
                  {lg.event_message && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{lg.event_message}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual result modal */}
      {showManual && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 28, width: 400 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB", marginBottom: 20 }}>Submit Manual Result</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Result</label>
                <select value={manualResult.result} onChange={e => setManualResult(r => ({ ...r, result: e.target.value }))} style={inputStyle}>
                  <option>Pass</option><option>Fail</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Score (optional)</label>
                <input type="number" min={0} max={100} value={manualResult.score} onChange={e => setManualResult(r => ({ ...r, score: e.target.value }))} style={inputStyle} placeholder="0–100" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Remarks (optional)</label>
                <textarea value={manualResult.remarks} onChange={e => setManualResult(r => ({ ...r, remarks: e.target.value }))} style={{ ...inputStyle, height: 80, resize: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowManual(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={handleManual} disabled={submitting} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#D4A63A", color: "#0B0B0F", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
