"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Clock, Search, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { assessmentService } from "@/services/assessments.service";
import { AssessmentDetailNav } from "./AssessmentDetailNav";
import type { AssessmentProgressSummary } from "@/types/assessment.types";
import { ASSIGNMENT_STATUSES } from "@/types/assessment.types";

interface Props {
  assessmentUuid: string;
}

const pageSize = 15;

const statusColors: Record<string, string> = {
  Assigned:    "bg-blue-500/15 text-blue-400",
  "In Progress": "bg-amber-500/15 text-amber-400",
  Completed:   "bg-teal-500/15 text-teal-400",
  Passed:      "bg-emerald-500/15 text-emerald-400",
  Failed:      "bg-red-500/15 text-red-400",
  Expired:     "bg-orange-500/15 text-orange-400",
  Cancelled:   "bg-muted text-muted-foreground",
};

const resultColors: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Passed:  "bg-emerald-500/15 text-emerald-400",
  Failed:  "bg-red-500/15 text-red-400",
};

const filterInput = cn(
  "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
);

interface StatCardProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ElementType;
}

function StatCard({ label, value, total, color, icon: Icon }: StatCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className={cn("p-2.5 rounded-lg flex-shrink-0", color + "/15")}>
        <Icon className={cn("w-4 h-4", color.replace("bg-", "text-").replace("/15", ""))} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {total > 0 && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", color)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pct}% of participants</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressDashboard({ assessmentUuid }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentUuid],
    queryFn: () => assessmentService.get(assessmentUuid).then(r => r.data),
  });

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["assessment-progress", assessmentUuid],
    queryFn: () => assessmentService.getProgressSummary(assessmentUuid).then(r => r.data),
    enabled: !!assessment,
    refetchInterval: 30_000,
  });

  const { data: paged, isLoading: loadingParticipants, refetch: refetchParticipants } = useQuery({
    queryKey: ["assessment-progress-participants", assessmentUuid, page, search, statusFilter],
    queryFn: () => assessmentService.getProgressParticipants(assessmentUuid, {
      page,
      page_size: pageSize,
      search: search || undefined,
      assignment_status: statusFilter || undefined,
    }).then(r => r.data),
    enabled: !!assessment,
  });

  function refetchAll() {
    refetchSummary();
    refetchParticipants();
  }

  const items = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  if (loadingAssessment) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading assessment...</div>;
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-destructive text-sm">
        <AlertCircle className="w-4 h-4" /> Assessment not found
      </div>
    );
  }

  const s: AssessmentProgressSummary = summary ?? {
    total_participants: 0, not_started: 0, in_progress: 0, completed: 0,
    passed: 0, failed: 0, expired: 0, cancelled: 0,
  };
  const passRate = s.total_participants > 0
    ? Math.round(((s.passed) / s.total_participants) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <AssessmentDetailNav
        assessmentUuid={assessmentUuid}
        assessmentName={assessment.assessment_name}
        assessmentCode={assessment.assessment_code}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Progress Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Live overview — refreshes every 30 seconds</p>
        </div>
        <button onClick={refetchAll} className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground" title="Refresh now">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Top-level stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Participants" value={s.total_participants} total={s.total_participants} color="bg-primary" icon={Users} />
            <StatCard label="Not Started" value={s.not_started} total={s.total_participants} color="bg-blue-500" icon={Clock} />
            <StatCard label="In Progress" value={s.in_progress} total={s.total_participants} color="bg-amber-500" icon={TrendingUp} />
            <StatCard label="Pass Rate" value={passRate} total={100} color="bg-emerald-500" icon={TrendingUp} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Completed" value={s.completed} total={s.total_participants} color="bg-teal-500" icon={CheckCircle2} />
            <StatCard label="Passed" value={s.passed} total={s.total_participants} color="bg-emerald-500" icon={CheckCircle2} />
            <StatCard label="Failed" value={s.failed} total={s.total_participants} color="bg-red-500" icon={XCircle} />
            <StatCard label="Expired / Cancelled" value={s.expired + s.cancelled} total={s.total_participants} color="bg-orange-500" icon={AlertCircle} />
          </div>
        </>
      )}

      {/* Participant breakdown table */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Participant Breakdown</h3>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search participants..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className={cn(filterInput, "pl-9")}
              />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={filterInput}>
              <option value="">All Statuses</option>
              {ASSIGNMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {loadingParticipants ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No participants to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">Sr.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Result</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attempts</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p, idx) => (
                    <tr key={p.uuid} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground leading-snug">
                          {p.user_full_name ?? <span className="text-muted-foreground italic">Unknown</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.user_email ?? `ID: ${p.user_id}`}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", statusColors[p.assignment_status] ?? "bg-muted text-muted-foreground")}>
                          {p.assignment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", resultColors[p.result_status] ?? "bg-muted text-muted-foreground")}>
                          {p.result_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{p.attempt_count}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.started_at ? new Date(p.started_at).toLocaleString() : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.completed_at ? new Date(p.completed_at).toLocaleString() : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">
                        {p.remarks ?? <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <span>{fromRow}–{toRow} of {total}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 rounded-md border border-border bg-muted/30 text-foreground text-xs">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
