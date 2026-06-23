"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService, type CandidateSession } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { PlayCircle, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  Pending: "#6B7280", Launching: "#2EA8FF", Running: "#22C55E",
  Completed: "#10B981", Failed: "#EF4444", Cancelled: "#F59E0B", "Timed Out": "#F97316",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "Running" || status === "Launching") return <PlayCircle size={14} style={{ color: STATUS_COLOR[status] }} />;
  if (status === "Completed") return <CheckCircle size={14} style={{ color: "#10B981" }} />;
  if (status === "Failed" || status === "Cancelled") return <XCircle size={14} style={{ color: STATUS_COLOR[status] }} />;
  return <Clock size={14} style={{ color: "#6B7280" }} />;
}

function SessionCard({ s }: { s: CandidateSession }) {
  const isActive = ["Pending", "Launching", "Running"].includes(s.status);
  const result = s.raw_result as { result?: string; score?: number } | null;

  return (
    <div style={{
      background: "#141821",
      border: `1px solid ${isActive ? "#22C55E40" : "#1E2430"}`,
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <StatusIcon status={s.status} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB" }}>
              {s.assessment_name ?? "Assessment Session"}
            </span>
          </div>
          {s.exercise_name && <div style={{ fontSize: 12, color: "#6B7280", marginLeft: 22 }}>{s.exercise_name}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[s.status] ?? "#6B7280"}20`, color: STATUS_COLOR[s.status] ?? "#6B7280" }}>
            {s.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Reference</div>
          <div style={{ fontSize: 12, color: "#D4A63A", fontFamily: "monospace" }}>{s.session_reference}</div>
        </div>
        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Mode</div>
          <div style={{ fontSize: 12, color: "#D1D5DB" }}>{s.runtime_mode}</div>
        </div>
        {s.started_at && (
          <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Started</div>
            <div style={{ fontSize: 12, color: "#D1D5DB" }}>{new Date(s.started_at).toLocaleString()}</div>
          </div>
        )}
        {s.completed_at && (
          <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Completed</div>
            <div style={{ fontSize: 12, color: "#D1D5DB" }}>{new Date(s.completed_at).toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Result */}
      {s.result_received && result && (
        <div style={{ background: result.result === "Pass" ? "#22C55E10" : "#EF444410", border: `1px solid ${result.result === "Pass" ? "#22C55E30" : "#EF444430"}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: result.result === "Pass" ? "#22C55E" : "#EF4444" }}>{result.result}</div>
          {result.score != null && <div style={{ fontSize: 13, color: "#9CA3AF" }}>Score: <strong style={{ color: "#F9FAFB" }}>{result.score}%</strong></div>}
        </div>
      )}

      {/* Failure reason */}
      {s.failure_reason && (
        <div style={{ background: "#EF444410", border: "1px solid #EF444430", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#EF4444", marginBottom: 2 }}>Session Error</div>
          <div style={{ fontSize: 12, color: "#F9FAFB" }}>{s.failure_reason}</div>
        </div>
      )}

      {/* Active session pulse */}
      {isActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 12, color: "#22C55E" }}>Session is active — your instructor will manage completion</span>
        </div>
      )}
    </div>
  );
}

export function CandidateSessionsView() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const load = useCallback(async () => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    setLoading(true);
    try {
      const res = await candidateService.listSessions(token, { page, page_size: pageSize });
      if (res.success) { setSessions(res.data!.items); setTotal(res.data!.total); }
    } finally { setLoading(false); }
  }, [page, router]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 4 }}>My Sessions</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>{total} session{total !== 1 ? "s" : ""} recorded for your account</p>
        </div>

        {loading ? (
          <div style={{ color: "#6B7280", fontSize: 13, padding: 60, textAlign: "center" }}>Loading your sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 60, textAlign: "center" }}>
            <PlayCircle size={40} style={{ color: "#374151", margin: "0 auto 12px" }} />
            <div style={{ color: "#6B7280", fontSize: 14 }}>No sessions yet</div>
            <div style={{ color: "#4B5563", fontSize: 12, marginTop: 4 }}>Start an assessment to create your first session</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sessions.map(s => <SessionCard key={s.uuid} s={s} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>Prev</button>
            <span style={{ fontSize: 13, color: "#D1D5DB" }}>{page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>Next</button>
          </div>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
