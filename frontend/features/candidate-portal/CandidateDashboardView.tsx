"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { ClipboardList, PlayCircle, CheckCircle, TrendingUp, Award, ChevronRight, Clock } from "lucide-react";

interface DashboardStats {
  total_assignments: number;
  in_progress: number;
  completed: number;
  assigned: number;
  passed: number;
  total_sessions: number;
  total_certificates: number;
}

interface RecentAssignment {
  uuid: string;
  assignment_status: string;
  assessment_name: string | null;
  campaign_name: string | null;
  due_date: string | null;
  can_start: boolean;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Assigned:      { color: "#2EA8FF", bg: "#2EA8FF20" },
  "In Progress": { color: "#F59E0B", bg: "#F59E0B20" },
  Completed:     { color: "#10B981", bg: "#10B98120" },
  Passed:        { color: "#22C55E", bg: "#22C55E20" },
  Failed:        { color: "#EF4444", bg: "#EF444420" },
  Expired:       { color: "#6B7280", bg: "#6B728020" },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#F9FAFB", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export function CandidateDashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }

    (async () => {
      try {
        const res = await candidateService.getDashboard(token);
        if (res.success && res.data) {
          setStats(res.data.stats);
          setRecent(res.data.recent_assignments ?? []);
        } else {
          setError("Failed to load dashboard");
        }
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Your assessment overview</p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280", fontSize: 14 }}>Loading...</div>
        )}

        {error && (
          <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 10, padding: 16, color: "#EF4444", fontSize: 14 }}>{error}</div>
        )}

        {stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <StatCard label="Total Assignments" value={stats.total_assignments} icon={ClipboardList} color="#2EA8FF" />
              <StatCard label="In Progress"       value={stats.in_progress}       icon={PlayCircle}   color="#F59E0B" />
              <StatCard label="Completed"         value={stats.completed}         icon={CheckCircle}  color="#10B981" />
              <StatCard label="Passed"            value={stats.passed}            icon={TrendingUp}   color="#22C55E" />
              <StatCard label="Sessions"          value={stats.total_sessions}    icon={PlayCircle}   color="#8B5CF6" />
              <StatCard label="Certificates"      value={stats.total_certificates} icon={Award}       color="#D4A63A" />
            </div>

            {recent.length > 0 && (
              <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2430", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Recent Assignments</h2>
                  <a href="/candidate/assessments" style={{ fontSize: 12, color: "#D4A63A", textDecoration: "none" }}>View all</a>
                </div>
                <div>
                  {recent.map((a) => {
                    const si = STATUS_COLORS[a.assignment_status] ?? { color: "#6B7280", bg: "#6B728020" };
                    const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !["Completed", "Passed", "Failed"].includes(a.assignment_status);
                    return (
                      <div key={a.uuid} style={{ padding: "14px 20px", borderBottom: "1px solid #0F1117", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#F9FAFB", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.assessment_name ?? "Assessment"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B7280" }}>
                            {a.campaign_name && <span>{a.campaign_name}</span>}
                            {a.due_date && (
                              <span style={{ display: "flex", alignItems: "center", gap: 3, color: isOverdue ? "#EF4444" : "#6B7280" }}>
                                <Clock size={10} />Due {new Date(a.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: si.bg, color: si.color, whiteSpace: "nowrap" }}>
                          {a.assignment_status}
                        </span>
                        {a.can_start && (
                          <button
                            onClick={() => router.push(`/candidate/assessments/${a.uuid}`)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "none", background: "#D4A63A", color: "#0B0B0F", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                            Start <ChevronRight size={12} />
                          </button>
                        )}
                        {!a.can_start && (
                          <button
                            onClick={() => router.push(`/candidate/assessments/${a.uuid}`)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recent.length === 0 && !loading && (
              <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                <ClipboardList size={36} color="#374151" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 15, fontWeight: 500, color: "#4B5563", marginBottom: 6 }}>No assignments yet</div>
                <div style={{ fontSize: 13, color: "#374151" }}>Your assigned assessments will appear here.</div>
              </div>
            )}
          </>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
