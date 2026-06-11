"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { weatherService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { WeatherCondition } from "@/types/master-data.types";

const PRECIP = ["None","Light","Moderate","Heavy","Extreme"];
const statusColors: Record<string, string> = { active: "bg-green-500/15 text-green-600 dark:text-green-400", inactive: "bg-muted text-muted-foreground" };

const schema = z.object({
  name: z.string().min(2,"Name required").max(100),
  wind_speed: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  precipitation_level: z.string().optional().or(z.literal("")),
  visibility_range: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
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

export function WeatherTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<WeatherCondition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeatherCondition | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const { data, isLoading } = useQuery({
    queryKey: ["master-data-weather", page, search, status],
    queryFn: () => weatherService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (formOpen) {
      reset(editItem ? {
        name: editItem.name, wind_speed: editItem.wind_speed ?? undefined,
        precipitation_level: editItem.precipitation_level ?? "",
        visibility_range: editItem.visibility_range ?? undefined,
        description: editItem.description ?? "", status: editItem.status as "active"|"inactive",
      } : { status: "active" });
    }
  }, [formOpen, editItem, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? weatherService.update(editItem!.uuid, data) : weatherService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-weather"] }); toast({ variant: "success", title: isEdit ? "Updated" : "Created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => weatherService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-weather"] }); setDeleteTarget(null); toast({ variant: "success", title: "Deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? weatherService.deactivate(uuid) : weatherService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-weather"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function openAdd() { setEditItem(null); setFormOpen(true); }
  function openEdit(w: WeatherCondition) { setEditItem(w); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: WeatherCondition[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search weather conditions..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Condition
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Weather Condition" : "Add Weather Condition"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <Field label="Name" required error={errors.name?.message}>
                  <input {...register("name")} placeholder="e.g. Heavy Rain" className={inputClass} />
                </Field>
              </div>
              <Field label="Wind Speed (kn)" error={errors.wind_speed?.message}>
                <input {...register("wind_speed")} type="number" step="0.1" placeholder="0.0" className={inputClass} />
              </Field>
              <Field label="Visibility Range (NM)" error={errors.visibility_range?.message}>
                <input {...register("visibility_range")} type="number" step="0.1" placeholder="0.0" className={inputClass} />
              </Field>
              <Field label="Precipitation Level" error={errors.precipitation_level?.message}>
                <select {...register("precipitation_level")} className={inputClass}>
                  <option value="">— None —</option>
                  {PRECIP.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Status" required error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <Field label="Description" error={errors.description?.message}>
                  <textarea {...register("description")} rows={2} placeholder="Optional..." className={cn(inputClass,"resize-none")} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
              <button type="button" onClick={closeForm} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create"}
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
                {["Sr No","Name","Wind Speed (kn)","Precipitation","Visibility Range (NM)","Status","Updated","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No weather conditions found.</td></tr>
              ) : items.map((w, idx) => (
                <tr key={w.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{w.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.wind_speed != null ? w.wind_speed.toFixed(1) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.precipitation_level ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.visibility_range != null ? w.visibility_range.toFixed(1) : "—"}</td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[w.status] ?? statusColors.inactive)}>{w.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(w.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(w)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: w.uuid, active: w.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={w.is_active ? "Deactivate" : "Activate"}>{w.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => setDeleteTarget(w)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
      <ConfirmModal open={!!deleteTarget} title="Delete Weather Condition" description={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
