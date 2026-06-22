"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Copy, Archive, CheckCircle2, Search, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { planService } from "@/services/plans.service";
import { PlanFormDialog } from "./PlanFormDialog";
import { ClonePlanDialog } from "./ClonePlanDialog";
import type { Plan } from "@/types/plan.types";
import { PLAN_STATUSES } from "@/types/plan.types";

const STATUS_COLORS: Record<string, string> = {
  Active:   "bg-emerald-500/15 text-emerald-400",
  Draft:    "bg-amber-500/15 text-amber-400",
  Archived: "bg-muted text-muted-foreground",
};

function fmt(n: number) { return n < 0 ? "Unlimited" : n.toLocaleString(); }
function fmtPrice(n: number) { return n === 0 ? "Free" : `$${n.toFixed(0)}/mo`; }

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function PlansTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [cloning, setCloning] = useState<Plan | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["plans", page, search, statusFilter],
    queryFn: async () => {
      const res = await planService.list({ page, page_size: pageSize, search: search || undefined, status: statusFilter || undefined });
      return res.data;
    },
    staleTime: 30_000,
  });

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => planService.archive(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (uuid: string) => planService.activate(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const plans = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Plan Name", "Code", "Monthly", "Candidates", "Assessments/mo", "Simulators", "Flags", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No plans match your filters." : "No plans yet. Click \"New Plan\" to create one."}
                  </td>
                </tr>
              ) : plans.map((plan, idx) => (
                <tr key={plan.uuid} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{plan.plan_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{plan.plan_code}</td>
                  <td className="px-4 py-3 text-foreground">{fmtPrice(plan.monthly_price)}</td>
                  <td className="px-4 py-3 text-foreground">{fmt(plan.max_candidates)}</td>
                  <td className="px-4 py-3 text-foreground">{fmt(plan.max_assessments_per_month)}</td>
                  <td className="px-4 py-3 text-foreground">{fmt(plan.max_simulators)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {plan.ai_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">AI</span>}
                      {plan.certificate_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Cert</span>}
                      {plan.offline_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Offline</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[plan.status] ?? "bg-muted text-muted-foreground")}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/plans/${plan.uuid}`}>
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Edit" onClick={() => setEditing(plan)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Clone" onClick={() => setCloning(plan)}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {plan.status !== "Active" ? (
                        <button className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors" title="Activate" onClick={() => activateMutation.mutate(plan.uuid)}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Archive" onClick={() => archiveMutation.mutate(plan.uuid)}>
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>

      <PlanFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} plan={editing} />
      {cloning && <ClonePlanDialog open={!!cloning} onClose={() => setCloning(null)} plan={cloning} />}
    </div>
  );
}
