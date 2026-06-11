"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { vesselService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Vessel } from "@/types/master-data.types";

const VESSEL_TYPES = [
  "Container Vessel","Bulk Carrier","Oil Tanker","Chemical Tanker","LNG Carrier",
  "Ferry","Tug","Fishing Vessel","Naval Vessel","Offshore Vessel","Custom",
];
const MANEUVERING = ["Excellent","Good","Fair","Poor"];

const schema = z.object({
  vessel_name: z.string().min(2,"Name must be at least 2 characters").max(255),
  vessel_code: z.string().min(2,"Code required").max(50),
  vessel_type: z.string().min(1,"Vessel type required"),
  imo_category: z.string().max(100).optional().or(z.literal("")),
  length:    z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  beam:      z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  draft:     z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  max_speed: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  maneuverability_rating: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active","inactive"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
};
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

function toCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g,"").replace(/\s+/g,"_").replace(/^_+|_+$/g,"").slice(0,50);
}

export function VesselsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vessel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vessel | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["master-data-vessels", page, search, vesselType, status],
    queryFn: () => vesselService.list({ page, page_size: pageSize, search: search || undefined, vessel_type: vesselType || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vessel_type: "Container Vessel", status: "active" },
  });

  const isEdit = !!editItem;
  const nameVal = watch("vessel_name");

  useEffect(() => {
    if (formOpen) {
      codeManual.current = false;
      reset(editItem ? {
        vessel_name: editItem.vessel_name, vessel_code: editItem.vessel_code,
        vessel_type: editItem.vessel_type, imo_category: editItem.imo_category ?? "",
        length: editItem.length ?? undefined, beam: editItem.beam ?? undefined,
        draft: editItem.draft ?? undefined, max_speed: editItem.max_speed ?? undefined,
        maneuverability_rating: editItem.maneuverability_rating ?? "",
        description: editItem.description ?? "", status: editItem.status as "active"|"inactive",
      } : { vessel_type: "Container Vessel", status: "active" });
    }
  }, [formOpen, editItem, reset]);

  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("vessel_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? vesselService.update(editItem!.uuid, data) : vesselService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data-vessels"] });
      toast({ variant: "success", title: isEdit ? "Vessel updated" : "Vessel created" });
      closeForm();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => vesselService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-vessels"] }); setDeleteTarget(null); toast({ variant: "success", title: "Vessel deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) =>
      active ? vesselService.deactivate(uuid) : vesselService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-vessels"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function openAdd() { setEditItem(null); setFormOpen(true); }
  function openEdit(v: Vessel) { setEditItem(v); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: Vessel[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search vessels..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={vesselType} onChange={e => { setVesselType(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Types</option>
          {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Vessel
        </button>
      </div>

      {/* Inline Form */}
      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Vessel" : "Add New Vessel"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <Field label="Vessel Name" required error={errors.vessel_name?.message}>
                  <input {...register("vessel_name")} placeholder="e.g. Container Vessel Alpha" className={inputClass} />
                </Field>
              </div>
              <Field label="Vessel Code" required error={errors.vessel_code?.message}>
                <input {...register("vessel_code")} placeholder="e.g. CVA-001" className={inputClass}
                  onChange={e => { codeManual.current = true; setValue("vessel_code", e.target.value.toUpperCase()); }} />
              </Field>
              <Field label="Vessel Type" required error={errors.vessel_type?.message}>
                <select {...register("vessel_type")} className={inputClass}>
                  {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="IMO Category" error={errors.imo_category?.message}>
                <input {...register("imo_category")} placeholder="e.g. Class I" className={inputClass} />
              </Field>
              <Field label="Maneuverability" error={errors.maneuverability_rating?.message}>
                <select {...register("maneuverability_rating")} className={inputClass}>
                  <option value="">— Select —</option>
                  {MANEUVERING.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Length (m)" error={errors.length?.message}>
                <input {...register("length")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Beam (m)" error={errors.beam?.message}>
                <input {...register("beam")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Draft (m)" error={errors.draft?.message}>
                <input {...register("draft")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Max Speed (kn)" error={errors.max_speed?.message}>
                <input {...register("max_speed")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Status" required error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description" error={errors.description?.message}>
                  <textarea {...register("description")} rows={2} placeholder="Optional description..." className={cn(inputClass, "resize-none")} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
              <button type="button" onClick={closeForm} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Vessel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Sr No","Vessel Name","Code","Type","Speed (kn)","Maneuverability","Status","Updated","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">No vessels found.</td></tr>
              ) : items.map((v, idx) => (
                <tr key={v.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{v.vessel_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.vessel_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.vessel_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.max_speed != null ? v.max_speed.toFixed(1) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.maneuverability_rating ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[v.status] ?? statusColors.inactive)}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(v.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: v.uuid, active: v.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={v.is_active ? "Deactivate" : "Activate"}>
                        {v.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteTarget(v)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <ConfirmModal open={!!deleteTarget} title="Delete Vessel" description={`Delete "${deleteTarget?.vessel_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
