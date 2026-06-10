"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usersService } from "@/services/users.service";
import type { User } from "@/types/common.types";
import { formatDate, getInitials } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/15 text-destructive",
  pending: "bg-warning/15 text-warning",
};

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => usersService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const paginatedData = data?.data;
  const users: User[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roles</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uuid} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span key={r} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary/10 text-secondary capitalize">
                            {r.replace("_", " ")}
                          </span>
                        ))}
                        {user.roles.length === 0 && <span className="text-muted-foreground text-xs">No roles</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[user.status] ?? "bg-muted text-muted-foreground")}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.last_login ? formatDate(user.last_login) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
              <span className="px-3 py-1.5 text-sm text-foreground">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
