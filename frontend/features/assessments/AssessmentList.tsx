"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, Archive, AlertCircle, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { assessmentService } from "@/services/assessments.service";
import type { AssessmentListItem, AssessmentStatus, AssessmentType } from "@/types/assessment.types";
import { ASSESSMENT_TYPES } from "@/types/assessment.types";

const pageSize = 15;

const filterInput = cn(
  "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
);

const statusColors: Record<string, string> = {
  draft:    "bg-muted text-muted-foreground",
  active:   "bg-emerald-500/15 text-emerald-400",
  archived: "bg-orange-500/15 text-orange-400",
};

const typeColors: Record<string, string> = {
  Training:      "bg-blue-500/10 text-blue-400",
  Evaluation:    "bg-purple-500/10 text-purple-400",
  Certification: "bg-amber-500/10 text-amber-400",
  Practice:      "bg-teal-500/10 text-teal-400",
};

export function AssessmentList() {
  const router = useRouter();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: paged, isLoading, error } = useQuery({
    queryKey: ["assessments", page, search, statusFilter, typeFilter],
    queryFn: () => assessmentService.list({
      page,
      page_size: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      assessment_type: typeFilter || undefined,
      sort_by: "created_at",
      sort_order: "desc",
    }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => assessmentService.delete(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast({ variant: "success", title: "Assessment deleted" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const activateMutation = useMutation({
    mutationFn: (uuid: string) => assessmentService.activate(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast({ variant: "success", title: "Assessment activated" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => assessmentService.archive(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast({ variant: "success", title: "Assessment archived" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const items = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  function confirmDelete(item: AssessmentListItem) {
    if (!confirm(`Delete assessment "${item.assessment_name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(item.uuid);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className={cn(filterInput, "pl-9 w-full")}
          />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Types</option>
          {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={() => router.push("/admin/assessments/builder")}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-destructive text-sm gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to load assessments
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Filter className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No assessments found</p>
            <button onClick={() => router.push("/admin/assessments/builder")}
              className="text-primary hover:underline text-sm">
              Create your first assessment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name / Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pass Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exercises</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participants</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => (
                  <tr key={item.uuid} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground leading-snug">{item.assessment_name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.assessment_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", typeColors[item.assessment_type] ?? "bg-muted text-muted-foreground")}>
                        {item.assessment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.duration_minutes ? `${item.duration_minutes} min` : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.passing_score != null ? `${item.passing_score}%` : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {item.exercise_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.participant_count}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", statusColors[item.status] ?? "bg-muted text-muted-foreground")}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/admin/assessments/builder?uuid=${item.uuid}`)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {item.status === "draft" && (
                          <button
                            onClick={() => activateMutation.mutate(item.uuid)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-emerald-400"
                            title="Activate"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.status === "active" && (
                          <button
                            onClick={() => archiveMutation.mutate(item.uuid)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-orange-400"
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}
