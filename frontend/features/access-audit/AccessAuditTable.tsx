"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { AuditLog } from "@/types/common.types";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import { formatDate } from "@/lib/utils";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const moduleColors: Record<string, string> = {
  auth:             "bg-blue-500/10 text-blue-400",
  users:            "bg-violet-500/10 text-violet-400",
  roles:            "bg-amber-500/10 text-amber-400",
  organizations:    "bg-emerald-500/10 text-emerald-400",
  invitations:      "bg-cyan-500/10 text-cyan-400",
  org_assignments:  "bg-pink-500/10 text-pink-400",
};

export function AccessAuditTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const pageSize = 30;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, search, moduleFilter],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedData<AuditLog>>>("/audit-logs", {
        params: { page, page_size: pageSize, search: search || undefined, module: moduleFilter || undefined },
      });
      return res.data;
    },
  });

  const paginatedData = data?.data;
  const items: AuditLog[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const MODULES = ["auth", "users", "roles", "organizations", "invitations", "org_assignments", "plans", "assessments"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search by user or resource..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={cn(inputClass, "pl-9 w-full")} />
        </div>
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Module", "Action", "User", "Resource", "IP Address", "Timestamp"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>)}</tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">{search || moduleFilter ? "No audit events match your filters." : "No audit events found."}</td></tr>
              ) : (
                items.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", moduleColors[log.module] ?? "bg-muted/60 text-muted-foreground")}>
                        {log.module.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground capitalize">{log.action.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                      {log.user_id ? log.user_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.resource_type ? (
                        <span>{log.resource_type} {log.resource_id ? <span className="font-mono">{log.resource_id.slice(0, 8)}…</span> : ""}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.ip_address ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">{total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
