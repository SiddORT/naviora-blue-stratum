"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { organizationsService } from "@/services/organizations.service";
import type { Organization } from "@/types/common.types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  trial: "bg-primary/15 text-primary",
  expired: "bg-destructive/15 text-destructive",
  suspended: "bg-warning/15 text-warning",
};

export function OrganizationsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["organizations", page, search],
    queryFn: () =>
      organizationsService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const paginatedData = data?.data;
  const orgs: Organization[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    {search ? "No organizations match your search." : "No organizations found."}
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.uuid} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{org.name}</div>
                      {org.email && <div className="text-xs text-muted-foreground">{org.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{org.code}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[org.subscription_status] ?? "bg-muted text-muted-foreground")}>
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {org.user_count} / {org.max_users}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(org.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
