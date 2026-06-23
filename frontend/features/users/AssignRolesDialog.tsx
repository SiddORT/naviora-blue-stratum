"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, ShieldCheck } from "lucide-react";
import { usersService } from "@/services/users.service";
import { rolesService } from "@/services/roles.service";
import type { User } from "@/types/common.types";

interface Props {
  open: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignRolesDialog({ open, user, onClose, onSuccess }: Props) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["roles-all"],
    queryFn: () => rolesService.list({ page: 1, page_size: 200 }),
    staleTime: 30000,
  });
  const roles = rolesData?.data?.items ?? [];

  useEffect(() => {
    if (open) {
      setSelectedSlugs(user.roles ?? []);
      setError(null);
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: () => usersService.assignRoles(user.uuid, { role_slugs: selectedSlugs }),
    onSuccess: () => { onSuccess(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Failed to assign roles");
    },
  });

  const toggle = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assign Roles</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.full_name} — {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {roles.map((role) => {
                const checked = selectedSlugs.includes(role.slug);
                return (
                  <label
                    key={role.uuid}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(role.slug)}
                      className="w-4 h-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{role.name}</span>
                        {role.is_system && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">System</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{role.permission_count} permissions</span>
                    </div>
                    {checked && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                  </label>
                );
              })}
              {roles.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No roles available</p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">{selectedSlugs.length} role(s) selected</span>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="gradient-gold text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {mutation.isPending ? "Saving..." : "Save Roles"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
