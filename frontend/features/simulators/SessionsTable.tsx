"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";
import type { SimulatorSession } from "@/types/simulator.types";
import { SessionDetailDrawer } from "./SessionDetailDrawer";

const statusColors: Record<string, string> = {
  PENDING:   "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  RUNNING:   "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-green-500/15 text-green-600 dark:text-green-400",
  FAILED:    "bg-destructive/15 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function SessionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["simulator-sessions", page, search, status],
    queryFn: () =>
      simulatorsService.listSessions({
        page, page_size: pageSize,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const paged = data?.data;
  const sessions: SimulatorSession[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by session reference..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Session Reference", "Simulator", "Candidate", "Assessment", "Status", "Started", "Duration"].map((h) => (
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                    {search || status ? "No sessions match your filters." : "No simulator sessions recorded yet."}
                  </td>
                </tr>
              ) : (
                sessions.map((s, idx) => (
                  <tr key={s.uuid} className="hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setSelectedUuid(s.uuid)}>
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{s.session_reference}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{s.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.candidate_id ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.assessment_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", statusColors[s.status] ?? "bg-muted text-muted-foreground")}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {s.start_time ? formatDate(s.start_time) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDuration(s.duration_seconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — always visible */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedUuid && (
        <SessionDetailDrawer uuid={selectedUuid} onClose={() => setSelectedUuid(null)} />
      )}
    </div>
  );
}
