"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { seaStateService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { SeaState } from "@/types/master-data.types";

const statusColors: Record<string, string> = { active: "bg-green-500/15 text-green-600 dark:text-green-400", inactive: "bg-muted text-muted-foreground" };

const schema = z.object({
  name: z.string().min(2,"Name required").max(100),
  wave_height_min: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  wave_height_max: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
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

export function SeaStatesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SeaState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeaState | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const { data, isLoading } = useQuery({
    queryKey: ["master-data-sea-states", page, search, status],
    queryFn: () => seaStateService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (formOpen) {
      reset(editItem ? {
        name: editItem.name, wave_height_min: editItem.wave_height_min ?? undefined,
        wave_height_max: editItem.wave_height_max ?? undefined,
        description: editItem.description ?? "", status: editItem.status as "active"|"inactive",
      } : { status: "active" });
    }
  }, [formOpen, editItem, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? seaStateService.update(editItem!.uuid, data) : seaStateService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-sea-states"] }); toast({ variant: "success", title: isEdit ? "Updated" : "Created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => seaStateService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-sea-states"] }); setDeleteTarget(null); toast({ variant: "success", title: "Deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? seaStateService.deactivate(uuid) : seaStateService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-sea-states"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function openAdd() { setEditItem(null); setFormOpen(true); }
  function openEdit(s: SeaState) { setEditItem(s); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: SeaState[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  function waveRange(s: SeaState) {
    if (s.wave_height_min == null && s.wave_height_max == null) return "—";
    if (s.wave_height_min == null) return `< ${s.wave_height_max!.toFixed(2)} m`;
    if (s.wave_height_max == null) return `> ${s.wave_height_min!.toFixed(2)} m`;
    return `${s.wave_height_min.toFixed(2)} – ${s.wave_height_max.toFixed(2)} m`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search sea states..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Sea State
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Sea State" : "Add Sea State"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <Field label="Name" required error={errors.name?.message}>
                  <input {...register("name")} placeholder="e.g. Moderate" className={inputClass} />
                </Field>
              </div>
              <Field label="Wave Height Min (m)" error={errors.wave_height_min?.message}>
                <input {...register("wave_height_min")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Wave Height Max (m)" error={errors.wave_height_max?.message}>
                <input {...register("wave_height_max")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
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
                {["Sr No","Name","Wave Height Range","Description","Status","Updated","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">No sea states found.</td></tr>
              ) : items.map((s, idx) => (
                <tr key={s.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{waveRange(s)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.description ?? "—"}</td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[s.status] ?? statusColors.inactive)}>{s.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(s.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: s.uuid, active: s.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={s.is_active ? "Deactivate" : "Activate"}>{s.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
      <ConfirmModal open={!!deleteTarget} title="Delete Sea State" description={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
