"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { invitationsService } from "@/services/invitations.service";
import { rolesService } from "@/services/roles.service";
import { organizationsService } from "@/services/organizations.service";

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ email: "", full_name: "", organization_id: "", role_id: "", message: "" });
  const [error, setError] = useState<string | null>(null);

  const { data: orgsData } = useQuery({
    queryKey: ["organizations-all"],
    queryFn: () => organizationsService.list({ page: 1, page_size: 200 }),
    staleTime: 60000,
  });
  const orgs = orgsData?.data?.items ?? [];

  const { data: rolesData } = useQuery({
    queryKey: ["roles-all"],
    queryFn: () => rolesService.list({ page: 1, page_size: 200 }),
    staleTime: 60000,
  });
  const roles = rolesData?.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => invitationsService.create({
      email: form.email,
      full_name: form.full_name || undefined,
      organization_id: form.organization_id ? parseInt(form.organization_id) : undefined,
      role_id: form.role_id ? parseInt(form.role_id) : undefined,
      message: form.message || undefined,
    }),
    onSuccess: () => onSuccess(),
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Failed to send invitation");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Invite User</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError(null); mutation.mutate(); }} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email <span className="text-destructive">*</span></label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputClass} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization</label>
              <select value={form.organization_id} onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))} className={inputClass}>
                <option value="">None</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
              <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))} className={inputClass}>
                <option value="">None</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Personal Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} className={cn(inputClass, "resize-none")} placeholder="Optional message to include in the invitation..." />
          </div>
          <p className="text-xs text-muted-foreground">The invitation link will expire in 7 days.</p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !form.email} className="gradient-gold text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
