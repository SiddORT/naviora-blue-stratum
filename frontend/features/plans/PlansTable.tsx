"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Copy, Archive, CheckCircle2, ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planService } from "@/services/plans.service";
import { PlanFormDialog } from "./PlanFormDialog";
import { ClonePlanDialog } from "./ClonePlanDialog";
import type { Plan } from "@/types/plan.types";
import { PLAN_STATUSES } from "@/types/plan.types";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function fmt(n: number) { return n < 0 ? "Unlimited" : n.toLocaleString(); }
function fmtPrice(n: number) { return n === 0 ? "Free" : `$${n.toFixed(0)}/mo`; }

export function PlansTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [cloning, setCloning] = useState<Plan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["plans", page, search, statusFilter],
    queryFn: async () => {
      const res = await planService.list({ page, page_size: 20, search: search || undefined, status: statusFilter === "all" ? undefined : statusFilter });
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
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search plans..." className="pl-9 bg-background border-border" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 bg-background border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-surface border-border">
            <SelectItem value="all">All Status</SelectItem>
            {PLAN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> New Plan
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              {["Plan Name", "Code", "Monthly", "Candidates", "Assessments/mo", "Simulators", "Flags", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface rounded animate-pulse w-20" /></td>
                  ))}
                </tr>
              ))
            ) : plans.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No plans found</td></tr>
            ) : plans.map((plan) => (
              <tr key={plan.uuid} className="hover:bg-surface/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{plan.plan_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{plan.plan_code}</td>
                <td className="px-4 py-3 text-foreground">{fmtPrice(plan.monthly_price)}</td>
                <td className="px-4 py-3 text-foreground">{fmt(plan.max_candidates)}</td>
                <td className="px-4 py-3 text-foreground">{fmt(plan.max_assessments_per_month)}</td>
                <td className="px-4 py-3 text-foreground">{fmt(plan.max_simulators)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {plan.ai_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-[#2EA8FF]/10 text-[#2EA8FF] border border-[#2EA8FF]/20">AI</span>}
                    {plan.certificate_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-[#D4A63A]/10 text-[#D4A63A] border border-[#D4A63A]/20">Cert</span>}
                    {plan.offline_enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Offline</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[plan.status] ?? ""}`}>{plan.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/plans/${plan.uuid}`}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditing(plan)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setCloning(plan)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {plan.status !== "Active" ? (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300" onClick={() => activateMutation.mutate(plan.uuid)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => archiveMutation.mutate(plan.uuid)}>
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} plans total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <PlanFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} plan={editing} />
      {cloning && <ClonePlanDialog open={!!cloning} onClose={() => setCloning(null)} plan={cloning} />}
    </div>
  );
}
