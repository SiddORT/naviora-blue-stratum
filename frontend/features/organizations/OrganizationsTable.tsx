"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { organizationsService } from "@/services/organizations.service";
import type { Organization } from "@/types/common.types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-muted text-muted-foreground",
  trial:     "bg-primary/15 text-primary",
  expired:   "bg-destructive/15 text-destructive",
  suspended: "bg-amber-500/15 text-amber-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function OrganizationsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["organizations", page, search, statusFilter],
    queryFn: () =>
      organizationsService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const paginatedData = data?.data;
  const orgs: Organization[] = (paginatedData?.items ?? []).filter((o) =>
    !statusFilter || o.subscription_status === statusFilter
  );
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
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
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
        <button className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Name", "Code", "Status", "Users", "Created"].map((h) => (
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
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No organizations match your filters." : "No organizations found."}
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{org.name}</div>
                      {org.email && <div className="text-xs text-muted-foreground">{org.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{org.code}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[org.subscription_status] ?? "bg-muted text-muted-foreground")}>
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {org.user_count} / {org.max_users}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(org.created_at)}
                    </td>
                  </tr>
                ))
              )}
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
    </div>
  );
}
