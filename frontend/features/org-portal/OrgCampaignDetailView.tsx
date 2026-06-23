"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, Target, Users, ClipboardCheck,
  CheckCircle2, XCircle, AlertCircle, Timer, TrendingUp, Search,
  ChevronLeft, ChevronRight, UserPlus, X,
} from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import {
  activateCampaign, archiveCampaign,
  assignCandidate, bulkAssignCandidates,
  getCampaign, listCampaignAssignments, publishCampaign,
} from "@/services/campaign.service";
import { listOrgCandidates } from "@/services/org-portal.service";
import type { AssignmentListItem, AssignmentStatus, CampaignDetail } from "@/types/campaign.types";
import type { OrgCandidateListItem } from "@/types/org-portal.types";

const STATUS_COLORS: Record<string, string> = {
  Draft: "#6B7280", Published: "#2EA8FF", Active: "#22C55E", Completed: "#D4A63A", Archived: "#4B5563",
  Assigned: "#2EA8FF", "In Progress": "#F59E0B", Passed: "#22C55E", Failed: "#EF4444",
  Expired: "#9CA3AF", Cancelled: "#6B7280",
};
const STATUS_BG: Record<string, string> = {
  Draft: "rgba(107,114,128,0.12)", Published: "rgba(46,168,255,0.12)", Active: "rgba(34,197,94,0.12)",
  Completed: "rgba(212,166,58,0.12)", Archived: "rgba(75,85,99,0.12)",
  Assigned: "rgba(46,168,255,0.12)", "In Progress": "rgba(245,158,11,0.12)",
  Passed: "rgba(34,197,94,0.12)", Failed: "rgba(239,68,68,0.12)",
  Expired: "rgba(156,163,175,0.12)", Cancelled: "rgba(107,114,128,0.12)",
};

export function OrgCampaignDetailView({ campaignUuid }: { campaignUuid: string }) {
  const { accessToken } = useOrgAuthStore();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [assignTotal, setAssignTotal] = useState(0);
  const [assignPage, setAssignPage] = useState(1);
  const [assignSearch, setAssignSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [allCandidates, setAllCandidates] = useState<OrgCandidateListItem[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const PAGE_SIZE = 10;

  const loadCampaign = useCallback(async () => {
    if (!accessToken) return;
    try {
      const c = await getCampaign(accessToken, campaignUuid);
      setCampaign(c);
    } catch {
      router.push("/org/assessment-campaigns");
    }
  }, [accessToken, campaignUuid, router]);

  const loadAssignments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await listCampaignAssignments(accessToken, campaignUuid, {
        page: assignPage, page_size: PAGE_SIZE,
        search: assignSearch || undefined,
      });
      setAssignments(res.items);
      setAssignTotal(res.total);
    } catch {
      setAssignments([]);
    }
  }, [accessToken, campaignUuid, assignPage, assignSearch]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCampaign(), loadAssignments()]).finally(() => setLoading(false));
  }, [loadCampaign, loadAssignments]);

  const openAssignModal = async () => {
    if (!accessToken) return;
    setShowAssign(true);
    setSelectedCandidateIds([]);
    try {
      const res = await listOrgCandidates(accessToken, { page: 1, page_size: 200, status: "active" });
      setAllCandidates(res.items);
    } catch {
      setAllCandidates([]);
    }
  };

  const handleBulkAssign = async () => {
    if (!accessToken || selectedCandidateIds.length === 0) return;
    setAssigning(true);
    try {
      await bulkAssignCandidates(accessToken, campaignUuid, { candidate_ids: selectedCandidateIds });
      setShowAssign(false);
      loadCampaign();
      loadAssignments();
    } catch {
    } finally {
      setAssigning(false);
    }
  };

  const handlePublish = async () => {
    if (!accessToken || !campaign) return;
    setActionLoading(true);
    try { await publishCampaign(accessToken, campaign.uuid); await loadCampaign(); }
    catch { }
    setActionLoading(false);
  };

  const handleActivate = async () => {
    if (!accessToken || !campaign) return;
    setActionLoading(true);
    try { await activateCampaign(accessToken, campaign.uuid); await loadCampaign(); }
    catch { }
    setActionLoading(false);
  };

  const handleArchive = async () => {
    if (!accessToken || !campaign) return;
    if (!confirm("Archive this campaign? This cannot be undone easily.")) return;
    setActionLoading(true);
    try { await archiveCampaign(accessToken, campaign.uuid); await loadCampaign(); }
    catch { }
    setActionLoading(false);
  };

  const filteredCandidates = allCandidates.filter(c =>
    !candidateSearch ||
    c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const assignedIds = new Set(assignments.map(a => a.candidate_email));
  const assignTotalPages = Math.max(1, Math.ceil(assignTotal / PAGE_SIZE));

  const counts = assignments.reduce((acc, a) => {
    acc[a.assignment_status] = (acc[a.assignment_status] ?? 0) + 1;
    return acc;
  }, {} as Record<AssignmentStatus, number>);

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading campaign...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/org/assessment-campaigns")}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-white">{campaign.campaign_name}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: STATUS_BG[campaign.status], color: STATUS_COLORS[campaign.status] }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[campaign.status] }} />
                {campaign.status}
              </span>
            </div>
            <p className="text-xs mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{campaign.campaign_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "Draft" && (
            <button onClick={handlePublish} disabled={actionLoading || !campaign.assessment}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "rgba(46,168,255,0.1)", color: "#2EA8FF", border: "1px solid rgba(46,168,255,0.2)" }}>
              {actionLoading ? "..." : "Publish"}
            </button>
          )}
          {campaign.status === "Published" && (
            <>
              <button onClick={openAssignModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }}>
                <UserPlus className="w-4 h-4" /> Assign Candidates
              </button>
              <button onClick={handleActivate} disabled={actionLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                {actionLoading ? "..." : "Activate"}
              </button>
            </>
          )}
          {campaign.status === "Active" && (
            <button onClick={openAssignModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }}>
              <UserPlus className="w-4 h-4" /> Assign Candidates
            </button>
          )}
          {!["Archived", "Draft"].includes(campaign.status) && (
            <button onClick={handleArchive} disabled={actionLoading}
                    className="px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}>
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Campaign Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Assessment */}
        <div className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Assessment</p>
          {campaign.assessment ? (
            <>
              <p className="text-sm font-medium text-white">{campaign.assessment.assessment_name}</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{campaign.assessment.assessment_code}</p>
              <div className="mt-2 flex gap-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                {campaign.assessment.duration_minutes && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{campaign.assessment.duration_minutes}m</span>
                )}
                {campaign.assessment.passing_score && (
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" />{campaign.assessment.passing_score}%</span>
                )}
                <span className="flex items-center gap-1"><ClipboardCheck className="w-3 h-3" />{campaign.assessment.exercise_count} ex</span>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No assessment selected</p>
          )}
        </div>

        {/* Schedule */}
        <div className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Schedule</p>
          {campaign.start_date ? (
            <>
              <div className="flex items-center gap-1.5 text-sm text-white">
                <Calendar className="w-4 h-4" style={{ color: "#D4A63A" }} />
                {new Date(campaign.start_date).toLocaleDateString()}
              </div>
              {campaign.end_date && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  to {new Date(campaign.end_date).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{campaign.timezone}</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No schedule set</p>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Assignments</p>
          <p className="text-2xl font-bold text-white">{assignTotal}</p>
          <div className="mt-2 space-y-1">
            {(["Assigned", "In Progress", "Passed", "Failed"] as AssignmentStatus[]).map(s => (
              counts[s] ? (
                <div key={s} className="flex items-center justify-between text-xs">
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{s}</span>
                  <span className="font-medium" style={{ color: STATUS_COLORS[s] }}>{counts[s]}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      </div>

      {/* Progress widgets */}
      {assignTotal > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Not Started", value: counts["Assigned"] ?? 0, icon: AlertCircle, color: "#2EA8FF" },
            { label: "In Progress", value: counts["In Progress"] ?? 0, icon: Timer, color: "#F59E0B" },
            { label: "Passed", value: counts["Passed"] ?? 0, icon: CheckCircle2, color: "#22C55E" },
            { label: "Failed", value: counts["Failed"] ?? 0, icon: XCircle, color: "#EF4444" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Assignments Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-medium text-white">Candidates ({assignTotal})</p>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="text" placeholder="Search..."
                   value={assignSearch} onChange={e => { setAssignSearch(e.target.value); setAssignPage(1); }}
                   className="w-full rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Candidate", "Rank", "Status", "Result", "Attempts", "Score", "Due"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <Users className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No candidates assigned yet</p>
                  {["Published", "Active"].includes(campaign.status) && (
                    <button onClick={openAssignModal}
                            className="mt-3 text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: "rgba(212,166,58,0.1)", color: "#D4A63A" }}>
                      Assign candidates
                    </button>
                  )}
                </td>
              </tr>
            ) : assignments.map(a => (
              <tr key={a.uuid} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{a.candidate_name ?? "—"}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{a.candidate_email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {a.rank_or_designation ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: STATUS_BG[a.assignment_status], color: STATUS_COLORS[a.assignment_status] }}>
                    {a.assignment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: STATUS_COLORS[a.result_status] ?? "rgba(255,255,255,0.4)" }}>
                  {a.result_status}
                </td>
                <td className="px-4 py-3 text-sm text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {a.attempt_count}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {a.final_score != null ? `${a.final_score}%` : "—"}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignTotalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5"
               style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Page {assignPage} of {assignTotalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setAssignPage(p => Math.max(1, p - 1))} disabled={assignPage === 1}
                      className="p-1 rounded disabled:opacity-40" style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setAssignPage(p => Math.min(assignTotalPages, p + 1))} disabled={assignPage === assignTotalPages}
                      className="p-1 rounded disabled:opacity-40" style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md rounded-2xl flex flex-col" style={{ background: "#141821", border: "1px solid rgba(212,166,58,0.2)", maxHeight: "80vh" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="text-base font-semibold text-white">Assign Candidates</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selectedCandidateIds.length} selected
                </p>
              </div>
              <button onClick={() => setShowAssign(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input type="text" placeholder="Search candidates..."
                       value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)}
                       className="w-full rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none"
                       style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredCandidates.map(c => {
                const sel = selectedCandidateIds.includes(c.id);
                const alreadyAssigned = assignedIds.has(c.email);
                return (
                  <button key={c.uuid} disabled={alreadyAssigned}
                          onClick={() => setSelectedCandidateIds(ids =>
                            ids.includes(c.id) ? ids.filter(i => i !== c.id) : [...ids, c.id]
                          )}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left disabled:opacity-40"
                          style={{
                            background: sel ? "rgba(212,166,58,0.07)" : "rgba(255,255,255,0.03)",
                            border: sel ? "1px solid rgba(212,166,58,0.2)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                         style={{
                           background: sel ? "linear-gradient(135deg,#D4A63A,#B8860B)" : alreadyAssigned ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
                         }}>
                      {sel ? <TrendingUp className="w-3 h-3 text-black" /> : alreadyAssigned ? <TrendingUp className="w-3 h-3" style={{ color: "#22C55E" }} /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{c.email}</p>
                    </div>
                    {alreadyAssigned && <span className="text-[10px]" style={{ color: "#22C55E" }}>Assigned</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setShowAssign(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
              <button onClick={handleBulkAssign} disabled={assigning || selectedCandidateIds.length === 0}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }}>
                {assigning ? "Assigning..." : `Assign ${selectedCandidateIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
