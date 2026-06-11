"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { envProfileService, weatherService, seaStateService, visibilityService, timeOfDayService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { EnvironmentProfile } from "@/types/master-data.types";

const statusColors: Record<string, string> = { active: "bg-green-500/15 text-green-600 dark:text-green-400", inactive: "bg-muted text-muted-foreground" };

const schema = z.object({
  profile_name: z.string().min(2,"Profile name required").max(255),
  weather_condition_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  sea_state_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  visibility_condition_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  time_of_day_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active","inactive"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const filterInput = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Badge({ label }: { label: string | null }) {
  if (!label) return <span className="text-muted-foreground">—</span>;
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted/60 text-foreground/80">{label}</span>;
}

export function EnvironmentProfilesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EnvironmentProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentProfile | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const { data, isLoading } = useQuery({
    queryKey: ["master-data-env-profiles", page, search, status],
    queryFn: () => envProfileService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const { data: wData } = useQuery({ queryKey: ["weather-all-active"], queryFn: () => weatherService.listAllActive(), enabled: formOpen });
  const { data: ssData } = useQuery({ queryKey: ["sea-states-all-active"], queryFn: () => seaStateService.listAllActive(), enabled: formOpen });
  const { data: vcData } = useQuery({ queryKey: ["visibility-all-active"], queryFn: () => visibilityService.listAllActive(), enabled: formOpen });
  const { data: todData } = useQuery({ queryKey: ["time-of-day-all-active"], queryFn: () => timeOfDayService.listAllActive(), enabled: formOpen });

  const weatherOptions = (wData?.data ?? []) as any[];
  const seaStateOptions = (ssData?.data ?? []) as any[];
  const visibilityOptions = (vcData?.data ?? []) as any[];
  const timeOfDayOptions = (todData?.data ?? []) as any[];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (formOpen) {
      reset(editItem ? {
        profile_name: editItem.profile_name,
        weather_condition_id: editItem.weather_condition_id ?? undefined,
        sea_state_id: editItem.sea_state_id ?? undefined,
        visibility_condition_id: editItem.visibility_condition_id ?? undefined,
        time_of_day_id: editItem.time_of_day_id ?? undefined,
        description: editItem.description ?? "",
        status: editItem.status as "active"|"inactive",
      } : { status: "active" });
    }
  }, [formOpen, editItem, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? envProfileService.update(editItem!.uuid, data) : envProfileService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-env-profiles"] }); toast({ variant: "success", title: isEdit ? "Updated" : "Created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => envProfileService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-env-profiles"] }); setDeleteTarget(null); toast({ variant: "success", title: "Deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? envProfileService.deactivate(uuid) : envProfileService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-env-profiles"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function openAdd() { setEditItem(null); setFormOpen(true); }
  function openEdit(ep: EnvironmentProfile) { setEditItem(ep); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: EnvironmentProfile[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search profiles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Profile
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Environment Profile" : "Add Environment Profile"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <Field label="Profile Name" required error={errors.profile_name?.message}>
                  <input {...register("profile_name")} placeholder="e.g. Clear Day Navigation" className={inputClass} />
                </Field>
              </div>
              <Field label="Status" required error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Environmental Components</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Weather Condition" error={errors.weather_condition_id?.message}>
                  <select {...register("weather_condition_id")} className={inputClass}>
                    <option value="">— None —</option>
                    {weatherOptions.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </Field>
                <Field label="Sea State" error={errors.sea_state_id?.message}>
                  <select {...register("sea_state_id")} className={inputClass}>
                    <option value="">— None —</option>
                    {seaStateOptions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Visibility Condition" error={errors.visibility_condition_id?.message}>
                  <select {...register("visibility_condition_id")} className={inputClass}>
                    <option value="">— None —</option>
                    {visibilityOptions.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Time of Day" error={errors.time_of_day_id?.message}>
                  <select {...register("time_of_day_id")} className={inputClass}>
                    <option value="">— None —</option>
                    {timeOfDayOptions.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="mt-4">
              <Field label="Description" error={errors.description?.message}>
                <textarea {...register("description")} rows={2} placeholder="Optional..." className={cn(inputClass,"resize-none")} />
              </Field>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
              <button type="button" onClick={closeForm} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Sr No","Profile Name","Weather","Sea State","Visibility","Time of Day","Status","Updated","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">No environment profiles found.</td></tr>
              ) : items.map((ep, idx) => (
                <tr key={ep.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{ep.profile_name}</td>
                  <td className="px-4 py-3"><Badge label={ep.weather_condition_name} /></td>
                  <td className="px-4 py-3"><Badge label={ep.sea_state_name} /></td>
                  <td className="px-4 py-3"><Badge label={ep.visibility_condition_name} /></td>
                  <td className="px-4 py-3"><Badge label={ep.time_of_day_name} /></td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[ep.status] ?? statusColors.inactive)}>{ep.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(ep.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(ep)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: ep.uuid, active: ep.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={ep.is_active ? "Deactivate" : "Activate"}>{ep.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => setDeleteTarget(ep)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>{total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">Previous</button>
            <span className="px-3 py-1 text-xs text-muted-foreground self-center">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>
      <ConfirmModal open={!!deleteTarget} title="Delete Environment Profile" description={`Delete "${deleteTarget?.profile_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
