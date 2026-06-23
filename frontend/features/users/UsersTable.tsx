"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, UserCog, ShieldCheck, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usersService } from "@/services/users.service";
import type { User } from "@/types/common.types";
import { formatDate, getInitials } from "@/lib/utils";
import { UserFormDialog } from "./UserFormDialog";
import { AssignRolesDialog } from "./AssignRolesDialog";

const statusColors: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-muted text-muted-foreground",
  suspended: "bg-destructive/15 text-destructive",
  pending:   "bg-amber-500/15 text-amber-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

interface MenuState {
  uuid: string;
  user: User;
  x: number;
  y: number;
}

const isSuperAdmin = (user: User) =>
  user.roles.includes("super_admin") || user.roles.includes("superadmin");

export function UsersTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [assignUser, setAssignUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 20;

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenuFor = useCallback((e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ uuid: user.uuid, user, x: rect.right, y: rect.bottom + 4 });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, statusFilter, userTypeFilter],
    queryFn: () => usersService.list({ page, page_size: pageSize, search: search || undefined, status: statusFilter || undefined, user_type: userTypeFilter || undefined }),
  });

  const paginatedData = data?.data;
  const users: User[] = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => usersService.delete(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ uuid, status }: { uuid: string; status: string }) => usersService.setStatus(uuid, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleDelete = (user: User) => {
    closeMenu();
    if (confirm(`Delete user "${user.full_name}"? This cannot be undone.`)) {
      deleteMutation.mutate(user.uuid);
    }
  };

  const handleStatusToggle = (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    statusMutation.mutate({ uuid: user.uuid, status: newStatus });
    closeMenu();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        <select value={userTypeFilter} onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Types</option>
          <option value="ADMIN">Admin</option>
          <option value="ORG_ADMIN">Org Admin</option>
          <option value="ASSESSOR">Assessor</option>
          <option value="CANDIDATE">Candidate</option>
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "User", "Type", "Roles", "Status", "Last Login", "Created", ""].map((h) => (
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
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                    {search || statusFilter ? "No users match your filters." : "No users found."}
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.uuid} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
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
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {(user.user_type ?? "ADMIN").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span key={r} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary/10 text-secondary capitalize">
                            {r.replace(/_/g, " ")}
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
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {user.last_login ? formatDate(user.last_login) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSuperAdmin(user) && (
                        <button
                          onClick={(e) => openMenuFor(e, user)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Fixed-position dropdown — escapes overflow:hidden/auto clipping */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-50 w-48 rounded-lg border border-border bg-card shadow-xl py-1"
            style={{ top: menu.y, right: `calc(100vw - ${menu.x}px)` }}
          >
            <button
              onClick={() => { setEditUser(menu.user); closeMenu(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <UserCog className="w-3.5 h-3.5" /> Edit User
            </button>
            <button
              onClick={() => { setAssignUser(menu.user); closeMenu(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Assign Roles
            </button>
            <button
              onClick={() => handleStatusToggle(menu.user)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {menu.user.status === "active" ? "Deactivate" : "Activate"}
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => handleDelete(menu.user)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}

      {showCreate && (
        <UserFormDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["users"] }); setShowCreate(false); }}
        />
      )}
      {editUser && (
        <UserFormDialog
          open={!!editUser}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["users"] }); setEditUser(null); }}
        />
      )}
      {assignUser && (
        <AssignRolesDialog
          open={!!assignUser}
          user={assignUser}
          onClose={() => setAssignUser(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["users"] }); setAssignUser(null); }}
        />
      )}
    </div>
  );
}
