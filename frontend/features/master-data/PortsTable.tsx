"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { portService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Port } from "@/types/master-data.types";

const TRAFFIC = ["Low","Medium","High","Very High"];
const trafficColors: Record<string, string> = {
  Low: "bg-green-500/15 text-green-600 dark:text-green-400",
  Medium: "bg-primary/10 text-primary",
  High: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Very High": "bg-red-500/15 text-red-600 dark:text-red-400",
};
const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
};

const schema = z.object({
  port_name: z.string().min(2,"Name required").max(255),
  port_code: z.string().min(2,"Code required").max(50),
  country: z.string().min(2,"Country required").max(100),
  city: z.string().max(100).optional().or(z.literal("")),
  latitude:  z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(-90).max(90).nullable().optional()),
  longitude: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(-180).max(180).nullable().optional()),
  traffic_density: z.string().min(1,"Required"),
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

export function PortsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [traffic, setTraffic] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Port | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Port | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const { data, isLoading } = useQuery({
    queryKey: ["master-data-ports", page, search, country, traffic, status],
    queryFn: () => portService.list({ page, page_size: pageSize, search: search || undefined, country: country || undefined, traffic_density: traffic || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { traffic_density: "Medium", status: "active" },
  });

  useEffect(() => {
    if (formOpen) {
      reset(editItem ? {
        port_name: editItem.port_name, port_code: editItem.port_code, country: editItem.country,
        city: editItem.city ?? "", latitude: editItem.latitude ?? undefined, longitude: editItem.longitude ?? undefined,
        traffic_density: editItem.traffic_density, description: editItem.description ?? "",
        status: editItem.status as "active"|"inactive",
      } : { traffic_density: "Medium", status: "active" });
    }
  }, [formOpen, editItem, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? portService.update(editItem!.uuid, data) : portService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-ports"] }); toast({ variant: "success", title: isEdit ? "Port updated" : "Port created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => portService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-ports"] }); setDeleteTarget(null); toast({ variant: "success", title: "Port deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? portService.deactivate(uuid) : portService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master-data-ports"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function openAdd() { setEditItem(null); setFormOpen(true); }
  function openEdit(p: Port) { setEditItem(p); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: Port[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search ports..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <input type="text" placeholder="Filter by country..." value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} className={filterInput} />
        <select value={traffic} onChange={e => { setTraffic(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Traffic</option>
          {TRAFFIC.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Port
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Port" : "Add New Port"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Field label="Port Name" required error={errors.port_name?.message}>
                  <input {...register("port_name")} placeholder="e.g. Port of Singapore" className={inputClass} />
                </Field>
              </div>
              <Field label="Port Code" required error={errors.port_code?.message}>
                <input {...register("port_code")} placeholder="e.g. SGSIN" className={inputClass} onChange={e => { e.target.value = e.target.value.toUpperCase(); }} />
              </Field>
              <Field label="Country" required error={errors.country?.message}>
                <input {...register("country")} placeholder="e.g. Singapore" className={inputClass} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <input {...register("city")} placeholder="e.g. Singapore" className={inputClass} />
              </Field>
              <Field label="Traffic Density" required error={errors.traffic_density?.message}>
                <select {...register("traffic_density")} className={inputClass}>
                  {TRAFFIC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Latitude" error={errors.latitude?.message}>
                <input {...register("latitude")} type="number" step="0.000001" placeholder="0.000000" className={inputClass} />
              </Field>
              <Field label="Longitude" error={errors.longitude?.message}>
                <input {...register("longitude")} type="number" step="0.000001" placeholder="0.000000" className={inputClass} />
              </Field>
              <Field label="Status" required error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Description" error={errors.description?.message}>
                  <textarea {...register("description")} rows={2} placeholder="Optional..." className={cn(inputClass,"resize-none")} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
              <button type="button" onClick={closeForm} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Port"}
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
                {["Sr No","Port Name","Code","Country","City","Traffic Density","Status","Updated","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">No ports found.</td></tr>
              ) : items.map((p, idx) => (
                <tr key={p.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.port_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.port_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.country}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city ?? "—"}</td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", trafficColors[p.traffic_density] ?? "bg-muted text-muted-foreground")}>{p.traffic_density}</span></td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[p.status] ?? statusColors.inactive)}>{p.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: p.uuid, active: p.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={p.is_active ? "Deactivate" : "Activate"}>{p.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
      <ConfirmModal open={!!deleteTarget} title="Delete Port" description={`Delete "${deleteTarget?.port_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
