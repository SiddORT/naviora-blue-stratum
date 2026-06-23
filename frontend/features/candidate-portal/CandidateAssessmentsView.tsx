"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService, type CandidateAssignment } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { ClipboardList, PlayCircle, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

const STATUS_INFO: Record<string, { color: string; bg: string }> = {
  Assigned:    { color: "#2EA8FF", bg: "#2EA8FF20" },
  "In Progress": { color: "#F59E0B", bg: "#F59E0B20" },
  Completed:   { color: "#10B981", bg: "#10B98120" },
  Passed:      { color: "#22C55E", bg: "#22C55E20" },
  Failed:      { color: "#EF4444", bg: "#EF444420" },
  Expired:     { color: "#6B7280", bg: "#6B728020" },
  Cancelled:   { color: "#6B7280", bg: "#6B728020" },
};

function AssignmentCard({ a, onStart }: { a: CandidateAssignment; onStart: (uuid: string) => void }) {
  const si = STATUS_INFO[a.assignment_status] ?? { color: "#6B7280", bg: "#6B728020" };
  const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !["Completed","Passed","Failed"].includes(a.assignment_status);

  return (
    <div style={{ background: "#141821", border: `1px solid ${isOverdue ? "#EF444430" : "#1E2430"}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB", marginBottom: 2 }}>{a.assessment_name ?? "Assessment"}</div>
          {a.campaign_name && <div style={{ fontSize: 12, color: "#6B7280" }}>{a.campaign_name}</div>}
          {a.assessment_code && <div style={{ fontSize: 11, color: "#4B5563", fontFamily: "monospace" }}>{a.assessment_code}</div>}
        </div>
        <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: si.bg, color: si.color, whiteSpace: "nowrap" }}>
          {a.assignment_status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Attempts</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>{a.attempt_count}</div>
        </div>
        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Score</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: a.final_score != null ? "#D4A63A" : "#4B5563" }}>
            {a.final_score != null ? `${a.final_score}%` : "—"}
          </div>
        </div>
        <div style={{ background: "#0B0B0F", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Result</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: a.result_status === "Passed" ? "#22C55E" : a.result_status === "Failed" ? "#EF4444" : "#6B7280" }}>
            {a.result_status}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280" }}>
          {a.assigned_at && <span>Assigned {new Date(a.assigned_at).toLocaleDateString()}</span>}
          {a.due_date && (
            <span style={{ color: isOverdue ? "#EF4444" : "#6B7280" }}>
              Due {new Date(a.due_date).toLocaleDateString()}
              {isOverdue && " (overdue)"}
            </span>
          )}
        </div>

        {a.can_start && (
          <button onClick={() => onStart(a.uuid)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4A63A", color: "#0B0B0F", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <PlayCircle size={14} />
            {a.assignment_status === "In Progress" && a.active_session_uuid ? "Resume Session" : "Start Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CandidateAssessmentsView() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const pageSize = 10;

  const load = useCallback(async () => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (filter) params.status = filter;
      const res = await candidateService.listAssignments(token, params);
      if (res.success) { setAssignments(res.data!.items); setTotal(res.data!.total); }
    } finally { setLoading(false); }
  }, [page, filter, router]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async (assignmentUuid: string) => {
    const token = candidateService.getToken();
    if (!token) return;
    setStarting(assignmentUuid);
    try {
      const res = await candidateService.startSession(token, assignmentUuid);
      if (res.success && res.data) {
        router.push(`/candidate/sessions`);
      }
    } finally { setStarting(null); }
  };

  const totalPages = Math.ceil(total / pageSize);
  const FILTERS = [
    { label: "All", value: "" },
    { label: "Assigned", value: "Assigned" },
    { label: "In Progress", value: "In Progress" },
    { label: "Completed", value: "Completed" },
  ];

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 4 }}>My Assessments</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>{total} assignment{total !== 1 ? "s" : ""} in your account</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, background: "#0B0B0F", borderRadius: 8, padding: 4, alignSelf: "flex-start" }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 13, cursor: "pointer", background: filter === f.value ? "#141821" : "transparent", color: filter === f.value ? "#F9FAFB" : "#6B7280", fontWeight: filter === f.value ? 600 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#6B7280", fontSize: 13, padding: 60, textAlign: "center" }}>Loading your assessments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 60, textAlign: "center" }}>
            <ClipboardList size={40} style={{ color: "#374151", margin: "0 auto 12px" }} />
            <div style={{ color: "#6B7280", fontSize: 14 }}>No assessments found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignments.map(a => (
              <AssignmentCard key={a.uuid} a={a} onStart={starting === a.uuid ? () => {} : handleStart} />
            ))}
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
