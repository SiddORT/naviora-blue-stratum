"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subscriptionService } from "@/services/plans.service";
import { SubscriptionFormDialog } from "./SubscriptionFormDialog";
import type { Subscription } from "@/types/plan.types";
import { SUBSCRIPTION_STATUSES } from "@/types/plan.types";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Trial: "bg-[#2EA8FF]/15 text-[#2EA8FF] border-[#2EA8FF]/30",
  Expired: "bg-red-500/15 text-red-400 border-red-500/30",
  Suspended: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString() : "—"; }

export function SubscriptionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", page, statusFilter],
    queryFn: async () => {
      const res = await subscriptionService.list({ page, page_size: 20, status: statusFilter === "all" ? undefined : statusFilter });
      return res.data;
    },
    staleTime: 30_000,
  });

  const subs = (data?.items ?? []).filter((s) =>
    !search || s.organization_name?.toLowerCase().includes(search.toLowerCase()) || s.plan_name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by org or plan..." className="pl-9 bg-background border-border" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 bg-background border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-surface border-border">
            <SelectItem value="all">All Status</SelectItem>
            {SUBSCRIPTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> New Subscription
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              {["Organization", "Plan", "Billing", "Start", "End", "Auto Renew", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface rounded animate-pulse w-20" /></td>)}</tr>
              ))
            ) : subs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No subscriptions found</td></tr>
            ) : subs.map((s) => (
              <tr key={s.uuid} className="hover:bg-surface/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{s.organization_name ?? `Org #${s.organization_id}`}</td>
                <td className="px-4 py-3 text-foreground">
                  <div>{s.plan_name ?? "—"}</div>
                  <div className="text-xs font-mono text-muted-foreground">{s.plan_code}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.billing_cycle}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.start_date)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.end_date)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${s.auto_renew ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                    {s.auto_renew ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[s.subscription_status] ?? ""}`}>{s.subscription_status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditing(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} subscriptions total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <SubscriptionFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} subscription={editing} />
    </div>
  );
}
