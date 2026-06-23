"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Edit, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rolesService } from "@/services/roles.service";
import type { Role } from "@/types/common.types";
import { formatDate } from "@/lib/utils";
import { RoleFormDialog } from "./RoleFormDialog";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function RolesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [cloneRole, setCloneRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["roles", page, search],
    queryFn: () => rolesService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const paginatedData = data?.data;
  const roles: Role[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => rolesService.delete(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      alert(err?.response?.data?.message ?? "Cannot delete this role");
    },
  });

  const handleDelete = (role: Role) => {
    if (role.is_system) { alert("System roles cannot be deleted."); return; }
    if (confirm(`Delete role "${role.name}"?`)) {
      deleteMutation.mutate(role.uuid);
    }
    setOpenMenu(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Role", "Slug", "Permissions", "Users", "Status", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
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
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                    {search ? "No roles match your search." : "No roles found."}
                  </td>
                </tr>
              ) : (
                roles.map((role, idx) => (
                  <tr key={role.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{role.name}</span>
                          {role.is_system && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">System</span>}
                        </div>
                        {role.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{role.description}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">{role.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{role.permission_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{role.user_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        role.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                      )}>
                        {role.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(role.uuid)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === role.uuid ? null : role.uuid)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenu === role.uuid && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
                              <button
                                onClick={() => { setEditRole(role); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => { setCloneRole(role); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" /> Clone
                              </button>
                              {!role.is_system && (
                                <>
                                  <div className="border-t border-border my-1" />
                                  <button
                                    onClick={() => handleDelete(role)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {showCreate && (
        <RoleFormDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["roles"] }); setShowCreate(false); }} />
      )}
      {editRole && (
        <RoleFormDialog open={!!editRole} role={editRole} onClose={() => setEditRole(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["roles"] }); setEditRole(null); }} />
      )}
      {cloneRole && (
        <RoleFormDialog open={!!cloneRole} cloneFrom={cloneRole} onClose={() => setCloneRole(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["roles"] }); setCloneRole(null); }} />
      )}
    </div>
  );
}
