"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usersService } from "@/services/users.service";
import { organizationsService } from "@/services/organizations.service";
import type { User } from "@/types/common.types";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";

interface Props {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserFormDialog({ open, user, onClose, onSuccess }: Props) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    username: "",
    phone: "",
    status: "active",
    user_type: "ADMIN",
    organization_id: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email,
        full_name: user.full_name,
        password: "",
        username: user.username ?? "",
        phone: user.phone ?? "",
        status: user.status,
        user_type: user.user_type ?? "ADMIN",
        organization_id: user.organization_id?.toString() ?? "",
        notes: user.notes ?? "",
      });
    } else {
      setForm({ email: "", full_name: "", password: "", username: "", phone: "", status: "active", user_type: "ADMIN", organization_id: "", notes: "" });
    }
    setError(null);
  }, [user, open]);

  const { data: orgsData } = useQuery({
    queryKey: ["organizations-all"],
    queryFn: () => organizationsService.list({ page: 1, page_size: 200 }),
    staleTime: 60000,
  });
  const orgs = orgsData?.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit
        ? usersService.update(user!.uuid, data)
        : usersService.create(data),
    onSuccess: () => { onSuccess(); },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Failed to save user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {
      full_name: form.full_name,
      username: form.username || undefined,
      phone: form.phone || undefined,
      status: form.status,
      user_type: form.user_type,
      organization_id: form.organization_id ? parseInt(form.organization_id) : null,
      notes: form.notes || undefined,
    };
    if (!isEdit) {
      payload.email = form.email;
      payload.password = form.password;
    }
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{isEdit ? "Edit User" : "Add User"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name <span className="text-destructive">*</span></label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required className={inputClass} placeholder="Jane Smith" />
            </div>

            {!isEdit && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email <span className="text-destructive">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="jane@example.com" />
              </div>
            )}

            {!isEdit && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password <span className="text-destructive">*</span></label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="Min 8 chars, upper, lower, digit" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputClass} placeholder="jane_smith" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+1 555 0100" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Type</label>
              <select value={form.user_type} onChange={e => setForm(f => ({ ...f, user_type: e.target.value }))} className={inputClass}>
                <option value="ADMIN">Admin</option>
                <option value="ORG_ADMIN">Org Admin</option>
                <option value="ASSESSOR">Assessor</option>
                <option value="CANDIDATE">Candidate</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization</label>
              <select value={form.organization_id} onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))} className={inputClass}>
                <option value="">None</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={cn(inputClass, "resize-none")} placeholder="Optional notes..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="gradient-gold text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
