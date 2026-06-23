"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { rolesService } from "@/services/roles.service";
import type { Role, Permission } from "@/types/common.types";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";

interface Props {
  open: boolean;
  role?: Role | null;
  cloneFrom?: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleFormDialog({ open, role, cloneFrom, onClose, onSuccess }: Props) {
  const isEdit = !!role;
  const isClone = !!cloneFrom;
  const sourceUuid = role?.uuid ?? cloneFrom?.uuid;

  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [permSearch, setPermSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: permData, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: () => rolesService.listAllPermissions(),
    staleTime: 60000,
  });
  const allPermissions: Permission[] = permData?.data ?? [];

  const { data: roleDetail } = useQuery({
    queryKey: ["role-detail", sourceUuid],
    queryFn: () => rolesService.get(sourceUuid!),
    enabled: !!sourceUuid,
    staleTime: 0,
  });

  useEffect(() => {
    if (!open) return;
    setPermSearch("");
    setError(null);
    if (isEdit && role) {
      setForm({ name: role.name, slug: role.slug, description: role.description ?? "" });
    } else if (isClone && cloneFrom) {
      setForm({ name: `${cloneFrom.name} (Copy)`, slug: "", description: cloneFrom.description ?? "" });
    } else {
      setForm({ name: "", slug: "", description: "" });
      setSelectedIds([]);
    }
  }, [open, role, cloneFrom, isEdit, isClone]);

  useEffect(() => {
    if (roleDetail?.data) {
      setSelectedIds(roleDetail.data.permissions.map(p => p.id));
    }
  }, [roleDetail]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return rolesService.update(role!.uuid, { name: form.name, description: form.description || undefined, permission_ids: selectedIds });
      } else if (isClone) {
        return rolesService.clone(cloneFrom!.uuid, { name: form.name, slug: form.slug, description: form.description || undefined });
      } else {
        return rolesService.create({ name: form.name, slug: form.slug, description: form.description || undefined, permission_ids: selectedIds });
      }
    },
    onSuccess: () => onSuccess(),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Failed to save role");
    },
  });

  const handleSlugify = (name: string) => {
    if (!isEdit) {
      setForm(f => ({ ...f, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") }));
    }
  };

  const togglePerm = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const groupedPerms = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const filteredModules = Object.entries(groupedPerms).filter(([mod, perms]) =>
    !permSearch || mod.includes(permSearch.toLowerCase()) || perms.some(p => p.action.includes(permSearch.toLowerCase()))
  );

  if (!open) return null;

  const title = isEdit ? "Edit Role" : isClone ? "Clone Role" : "Create Role";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name <span className="text-destructive">*</span></label>
              <input
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); handleSlugify(e.target.value); }}
                required className={inputClass} placeholder="Super Admin"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug {!isEdit && <span className="text-destructive">*</span>}</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                disabled={isEdit}
                className={cn(inputClass, isEdit && "opacity-50 cursor-not-allowed")}
                placeholder="super_admin"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} placeholder="Role description..." />
            </div>
          </div>

          {!isClone && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</label>
                <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={permSearch}
                  onChange={e => setPermSearch(e.target.value)}
                  placeholder="Filter permissions..."
                  className={cn(inputClass, "pl-9 text-xs py-1.5")}
                />
              </div>
              {permsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border border-border rounded-lg p-3">
                  {filteredModules.map(([module, perms]) => (
                    <div key={module}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-foreground capitalize">{module.replace(/_/g, " ")}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allSelected = perms.every(p => selectedIds.includes(p.id));
                            if (allSelected) {
                              setSelectedIds(prev => prev.filter(id => !perms.find(p => p.id === id)));
                            } else {
                              setSelectedIds(prev => [...new Set([...prev, ...perms.map(p => p.id)])]);
                            }
                          }}
                          className="text-xs text-secondary hover:underline"
                        >
                          {perms.every(p => selectedIds.includes(p.id)) ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePerm(p.id)}
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border transition-colors",
                              selectedIds.includes(p.id)
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground"
                            )}
                          >
                            {p.action}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredModules.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No permissions match</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || (!isEdit && !form.slug)}
            className="gradient-gold text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : isClone ? "Clone Role" : isEdit ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
