"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionService } from "@/services/plans.service";
import { SubscriptionFormDialog } from "./SubscriptionFormDialog";
import type { Subscription } from "@/types/plan.types";
import { SUBSCRIPTION_STATUSES } from "@/types/plan.types";

const STATUS_COLORS: Record<string, string> = {
  Active:    "bg-emerald-500/15 text-emerald-400",
  Trial:     "bg-secondary/15 text-secondary",
  Expired:   "bg-destructive/15 text-destructive",
  Suspended: "bg-amber-500/15 text-amber-400",
  Cancelled: "bg-muted text-muted-foreground",
};

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function SubscriptionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", page, statusFilter],
    queryFn: async () => {
      const res = await subscriptionService.list({ page, page_size: pageSize, status: statusFilter || undefined });
      return res.data;
    },
    staleTime: 30_000,
  });

  const subs = (data?.items ?? []).filter((s) =>
    !search || s.organization_name?.toLowerCase().includes(search.toLowerCase()) || s.plan_name?.toLowerCase().includes(search.toLowerCase())
  );
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
            placeholder="Search by org or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          {SUBSCRIPTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Organization", "Plan", "Billing", "Start", "End", "Auto Renew", "Status", ""].map((h) => (
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No subscriptions match your filters." : "No subscriptions yet. Click \"New Subscription\" to create one."}
                  </td>
                </tr>
              ) : subs.map((s, idx) => (
                <tr key={s.uuid} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.organization_name ?? `Org #${s.organization_id}`}</td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{s.plan_name ?? "—"}</div>
                    <div className="text-xs font-mono text-muted-foreground">{s.plan_code}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.billing_cycle}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(s.start_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(s.end_date)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", s.auto_renew ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>
                      {s.auto_renew ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[s.subscription_status] ?? "bg-muted text-muted-foreground")}>
                      {s.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(s)} title="Edit" className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
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

      <SubscriptionFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} subscription={editing} />
    </div>
  );
}
