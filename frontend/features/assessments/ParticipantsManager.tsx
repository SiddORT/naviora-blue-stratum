"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, UserPlus, Users, Trash2, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, X, Check, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { assessmentService } from "@/services/assessments.service";
import { AssessmentDetailNav } from "./AssessmentDetailNav";
import type {
  AssessmentParticipant,
  AssessmentParticipantCreatePayload,
  AssessmentParticipantBulkAssignPayload,
  AssignmentStatus,
  ResultStatus,
} from "@/types/assessment.types";
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

// ── Assign dialog ──────────────────────────────────────────────────────────────

interface AssignDialogProps {
  assessmentUuid: string;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignDialog({ assessmentUuid, onClose, onAssigned }: AssignDialogProps) {
  const [userId, setUserId] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) {
      toast({ variant: "destructive", title: "User ID is required" });
      return;
    }
    const id = parseInt(userId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      toast({ variant: "destructive", title: "Enter a valid numeric User ID" });
      return;
    }
    setLoading(true);
    try {
      const payload: AssessmentParticipantCreatePayload = {
        user_id: id,
        max_attempts_override: maxAttempts ? parseInt(maxAttempts, 10) : undefined,
        remarks: remarks || undefined,
      };
      await assessmentService.addParticipant(assessmentUuid, payload);
      toast({ variant: "success", title: "Participant assigned" });
      onAssigned();
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to assign", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Assign Participant</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">User ID <span className="text-destructive">*</span></label>
            <input
              type="number"
              min={1}
              placeholder="Enter numeric user ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className={cn(filterInput, "w-full")}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Attempts Override</label>
            <input
              type="number"
              min={1}
              placeholder="Inherit from assessment"
              value={maxAttempts}
              onChange={e => setMaxAttempts(e.target.value)}
              className={cn(filterInput, "w-full")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
            <textarea
              rows={2}
              placeholder="Optional notes"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className={cn(filterInput, "w-full resize-none")}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Update status dialog ───────────────────────────────────────────────────────

interface UpdateDialogProps {
  participant: AssessmentParticipant;
  assessmentUuid: string;
  onClose: () => void;
  onUpdated: () => void;
}

function UpdateDialog({ participant, assessmentUuid, onClose, onUpdated }: UpdateDialogProps) {
  const [status, setStatus] = useState<AssignmentStatus>(participant.assignment_status);
  const [resultStatus, setResultStatus] = useState<ResultStatus>(participant.result_status);
  const [remarks, setRemarks] = useState(participant.remarks ?? "");
  const [maxAttempts, setMaxAttempts] = useState(participant.max_attempts_override?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await assessmentService.updateParticipant(assessmentUuid, participant.uuid, {
        assignment_status: status,
        result_status: resultStatus,
        max_attempts_override: maxAttempts ? parseInt(maxAttempts, 10) : undefined,
        remarks: remarks || undefined,
      });
      toast({ variant: "success", title: "Participant updated" });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Update Participant</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{participant.user_full_name ?? `User #${participant.user_id}`}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assignment Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as AssignmentStatus)} className={cn(filterInput, "w-full")}>
              {ASSIGNMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Result Status</label>
            <select value={resultStatus} onChange={e => setResultStatus(e.target.value as ResultStatus)} className={cn(filterInput, "w-full")}>
              <option value="Pending">Pending</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Attempts Override</label>
            <input type="number" min={1} placeholder="Inherit from assessment" value={maxAttempts}
              onChange={e => setMaxAttempts(e.target.value)} className={cn(filterInput, "w-full")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Remarks</label>
            <textarea rows={2} placeholder="Optional notes" value={remarks}
              onChange={e => setRemarks(e.target.value)} className={cn(filterInput, "w-full resize-none")} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ParticipantsManager({ assessmentUuid }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<AssessmentParticipant | null>(null);

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentUuid],
    queryFn: () => assessmentService.get(assessmentUuid).then(r => r.data),
  });

  const { data: paged, isLoading, error, refetch } = useQuery({
    queryKey: ["assessment-participants", assessmentUuid, page, search, statusFilter],
    queryFn: () => assessmentService.listParticipants(assessmentUuid, {
      page,
      page_size: pageSize,
      search: search || undefined,
      assignment_status: statusFilter || undefined,
      sort_by: "assigned_at",
      sort_order: "desc",
    }).then(r => r.data),
    enabled: !!assessment,
  });

  const removeMutation = useMutation({
    mutationFn: (participantUuid: string) => assessmentService.removeParticipant(assessmentUuid, participantUuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-participants", assessmentUuid] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast({ variant: "success", title: "Participant removed" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Remove failed", description: e.message }),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["assessment-participants", assessmentUuid] });
    qc.invalidateQueries({ queryKey: ["assessments"] });
    qc.invalidateQueries({ queryKey: ["assessment", assessmentUuid] });
  }

  function confirmRemove(p: AssessmentParticipant) {
    const name = p.user_full_name ?? `User #${p.user_id}`;
    if (!confirm(`Remove "${name}" from this assessment?`)) return;
    removeMutation.mutate(p.uuid);
  }

  const items = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  if (loadingAssessment) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading assessment...
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-destructive text-sm">
        <AlertCircle className="w-4 h-4" /> Assessment not found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AssessmentDetailNav
          assessmentUuid={assessmentUuid}
          assessmentName={assessment.assessment_name}
          assessmentCode={assessment.assessment_code}
        />

        {/* Status banner when not active */}
        {assessment.status !== "active" && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400">
              This assessment is <strong>{assessment.status}</strong>. Activate it before assigning participants.
            </p>
          </div>
        )}

        {/* Sub-header */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Participants</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{total} participant{total !== 1 ? "s" : ""} assigned</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            {assessment.status === "active" && (
              <button
                onClick={() => setShowAssignDialog(true)}
                className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" /> Assign Participant
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className={cn(filterInput, "pl-9 w-full")}
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={filterInput}>
            <option value="">All Statuses</option>
            {ASSIGNMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-destructive text-sm gap-2">
              <AlertCircle className="w-4 h-4" /> Failed to load participants
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Users className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No participants assigned</p>
              {assessment.status === "active" && (
                <button onClick={() => setShowAssignDialog(true)} className="text-primary hover:underline text-sm">
                  Assign the first participant
                </button>
              )}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Actions</th>
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
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {p.attempt_count}
                        {p.max_attempts_override != null && (
                          <span className="text-muted-foreground/50"> / {p.max_attempts_override}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.assigned_at ? new Date(p.assigned_at).toLocaleDateString() : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingParticipant(p)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => confirmRemove(p)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                            title="Remove"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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

      {showAssignDialog && (
        <AssignDialog
          assessmentUuid={assessmentUuid}
          onClose={() => setShowAssignDialog(false)}
          onAssigned={invalidate}
        />
      )}

      {editingParticipant && (
        <UpdateDialog
          participant={editingParticipant}
          assessmentUuid={assessmentUuid}
          onClose={() => setEditingParticipant(null)}
          onUpdated={invalidate}
        />
      )}
    </>
  );
}
