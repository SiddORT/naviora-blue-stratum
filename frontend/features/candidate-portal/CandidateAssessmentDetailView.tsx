"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService, type CandidateAssignment } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { ArrowLeft, ClipboardList, CheckCircle, PlayCircle, BookOpen, Clock, Shield } from "lucide-react";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Assigned:      { color: "#2EA8FF", bg: "#2EA8FF20" },
  "In Progress": { color: "#F59E0B", bg: "#F59E0B20" },
  Completed:     { color: "#10B981", bg: "#10B98120" },
  Passed:        { color: "#22C55E", bg: "#22C55E20" },
  Failed:        { color: "#EF4444", bg: "#EF444420" },
  Expired:       { color: "#6B7280", bg: "#6B728020" },
};

interface Props { uuid: string; }

export function CandidateAssessmentDetailView({ uuid }: Props) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<CandidateAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  const load = useCallback(async () => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    try {
      const res = await candidateService.getAssignment(token, uuid);
      if (res.success && res.data) {
        setAssignment(res.data);
      } else {
        setError("Assessment not found");
      }
    } catch {
      setError("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }, [uuid, router]);

  useEffect(() => { load(); }, [load]);

  const handleCheckin = () => {
    router.push(`/candidate/checkin/${uuid}`);
  };

  const handleStart = async () => {
    if (!assignment) return;
    const token = candidateService.getToken();
    if (!token) return;

    if (assignment.active_session_uuid) {
      router.push(`/candidate/sessions`);
      return;
    }

    setLaunching(true);
    try {
      const res = await candidateService.startSession(token, uuid);
      if (res.success) {
        router.push("/candidate/sessions");
      } else {
        setError("Failed to start session");
      }
    } catch {
      setError("Failed to start session");
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <CandidatePortalLayout>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280", fontSize: 14 }}>Loading...</div>
      </CandidatePortalLayout>
    );
  }

  if (error || !assignment) {
    return (
      <CandidatePortalLayout>
        <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 10, padding: 20, color: "#EF4444" }}>{error ?? "Not found"}</div>
      </CandidatePortalLayout>
    );
  }

  const si = STATUS_COLORS[assignment.assignment_status] ?? { color: "#6B7280", bg: "#6B728020" };
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !["Completed", "Passed", "Failed"].includes(assignment.assignment_status);

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back */}
        <button onClick={() => router.push("/candidate/assessments")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, padding: 0 }}>
          <ArrowLeft size={14} /> Back to Assessments
        </button>

        {/* Header */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", margin: "0 0 6px" }}>{assignment.assessment_name ?? "Assessment"}</h1>
              {assignment.campaign_name && <div style={{ fontSize: 13, color: "#9CA3AF" }}>{assignment.campaign_name}</div>}
              {assignment.assessment_code && <div style={{ fontSize: 12, color: "#4B5563", fontFamily: "monospace", marginTop: 2 }}>{assignment.assessment_code}</div>}
            </div>
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: si.bg, color: si.color }}>
              {assignment.assignment_status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          {[
            { label: "Attempts", value: String(assignment.attempt_count), icon: ClipboardList, color: "#2EA8FF" },
            { label: "Exercises", value: String(assignment.exercise_count), icon: BookOpen, color: "#8B5CF6" },
            { label: "Score", value: assignment.final_score != null ? `${assignment.final_score}%` : "—", icon: CheckCircle, color: "#D4A63A" },
            { label: "Result", value: assignment.result_status, icon: CheckCircle, color: assignment.result_status === "Passed" ? "#22C55E" : assignment.result_status === "Failed" ? "#EF4444" : "#6B7280" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Icon size={13} color={color} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeline</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Assigned", date: assignment.assigned_at, icon: ClipboardList },
              { label: "Started", date: assignment.started_at, icon: PlayCircle },
              { label: "Completed", date: assignment.completed_at, icon: CheckCircle },
              { label: "Due Date", date: assignment.due_date, icon: Clock, warn: isOverdue },
            ].map(({ label, date, icon: Icon, warn }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={14} color={warn ? "#EF4444" : date ? "#D4A63A" : "#374151"} />
                <span style={{ fontSize: 13, color: "#6B7280", width: 80 }}>{label}</span>
                <span style={{ fontSize: 13, color: warn ? "#EF4444" : date ? "#F9FAFB" : "#374151" }}>
                  {date ? new Date(date).toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Proctoring Requirements */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Shield size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Proctoring Requirements
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Identity confirmation required", "Assessment rules acceptance required", "Browser focus monitoring active", "Session events are recorded"].map((req) => (
              <div key={req} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4A63A", flexShrink: 0 }} />
                {req}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {assignment.can_start && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleCheckin}
              style={{ flex: 1, minWidth: 140, padding: "12px 20px", borderRadius: 8, border: "1px solid #D4A63A", background: "transparent", color: "#D4A63A", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Begin Check-In
            </button>
            <button onClick={handleStart} disabled={launching}
              style={{ flex: 1, minWidth: 140, padding: "12px 20px", borderRadius: 8, border: "none", background: assignment.active_session_uuid ? "#10B981" : "#D4A63A", color: "#0B0B0F", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: launching ? 0.7 : 1 }}>
              {launching ? "Launching..." : assignment.active_session_uuid ? "Continue Session" : "Start Assessment"}
            </button>
          </div>
        )}

        {!assignment.can_start && (
          <div style={{ background: "#1E2430", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#6B7280" }}>
            This assignment cannot be started in its current state ({assignment.assignment_status}).
          </div>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
