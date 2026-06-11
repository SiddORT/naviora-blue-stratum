"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Copy, Archive, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { variantService, exerciseService } from "@/services/exercises.service";
import { vesselService, portService, envProfileService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { ExerciseVariant, Exercise } from "@/types/exercise.types";

const schema = z.object({
  variant_name: z.string().min(2, "Name required").max(255),
  variant_code: z.string().min(2, "Code required").max(50),
  exercise_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number({ required_error: "Exercise required" })),
  port_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  environment_profile_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  primary_vessel_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  secondary_vessel_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  tertiary_vessel_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  duration_minutes: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(1).nullable().optional()),
  passing_score: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(100).nullable().optional()),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "active", "archived"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const filterInput = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

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
  return name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}

export function VariantsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExerciseVariant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseVariant | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["exercise-variants", page, search, status],
    queryFn: () => variantService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const { data: exercisesData } = useQuery({ queryKey: ["exercises-all"], queryFn: () => exerciseService.list({ page_size: 100 }) });
  const { data: vesselsData } = useQuery({ queryKey: ["vessels-all-active"], queryFn: () => vesselService.listAllActive() });
  const { data: portsData } = useQuery({ queryKey: ["ports-all-active"], queryFn: () => portService.listAllActive() });
  const { data: envProfilesData } = useQuery({ queryKey: ["env-profiles-all-active"], queryFn: () => envProfileService.listAllActive() });

  const exercises: Exercise[] = (exercisesData as any)?.data?.items ?? [];
  const vessels: any[] = (vesselsData as any)?.data ?? [];
  const ports: any[] = (portsData as any)?.data ?? [];
  const envProfiles: any[] = (envProfilesData as any)?.data ?? [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "draft" },
  });

  const isEdit = !!editItem;
  const nameVal = watch("variant_name");

  useEffect(() => {
    if (formOpen) {
      codeManual.current = false;
      reset(editItem ? {
        variant_name: editItem.variant_name, variant_code: editItem.variant_code,
        exercise_id: editItem.exercise_id, port_id: editItem.port_id ?? undefined,
        environment_profile_id: editItem.environment_profile_id ?? undefined,
        primary_vessel_id: editItem.primary_vessel_id ?? undefined,
        secondary_vessel_id: editItem.secondary_vessel_id ?? undefined,
        tertiary_vessel_id: editItem.tertiary_vessel_id ?? undefined,
        duration_minutes: editItem.duration_minutes ?? undefined,
        passing_score: editItem.passing_score ?? undefined,
        description: editItem.description ?? "", status: editItem.status as "draft" | "active" | "archived",
      } : { status: "draft" });
    }
  }, [formOpen, editItem, reset]);

  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("variant_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => isEdit ? variantService.update(editItem!.uuid, d as any) : variantService.create(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-variants"] }); toast({ variant: "success", title: isEdit ? "Variant updated" : "Variant created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => variantService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-variants"] }); setDeleteTarget(null); toast({ variant: "success", title: "Variant deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => variantService.deactivate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-variants"] }); toast({ variant: "success", title: "Variant archived" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const activateMutation = useMutation({
    mutationFn: (uuid: string) => variantService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-variants"] }); toast({ variant: "success", title: "Variant activated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/v1/exercises/variants/${uuid}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Duplicate failed");
      return json;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-variants"] }); toast({ variant: "success", title: "Variant duplicated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: ExerciseVariant[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search variants..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Variant
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Variant" : "Add New Variant"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Variant Name" required error={errors.variant_name?.message}>
                  <input {...register("variant_name")} placeholder="e.g. Day Crossing — Clear" className={inputClass} />
                </Field>
              </div>
              <Field label="Variant Code" required error={errors.variant_code?.message}>
                <input {...register("variant_code")} placeholder="e.g. DAY_CROSS_CLEAR" className={inputClass}
                  onChange={e => { codeManual.current = true; setValue("variant_code", e.target.value.toUpperCase()); }} />
              </Field>
              <Field label="Exercise" required error={errors.exercise_id?.message}>
                <select {...register("exercise_id")} className={inputClass}>
                  <option value="">— Select Exercise —</option>
                  {exercises.map((e: Exercise) => <option key={e.id} value={e.id}>{e.exercise_name}</option>)}
                </select>
              </Field>
              <Field label="Port" error={errors.port_id?.message}>
                <select {...register("port_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {ports.map((p: any) => <option key={p.id} value={p.id}>{p.port_name}</option>)}
                </select>
              </Field>
              <Field label="Environment Profile" error={errors.environment_profile_id?.message}>
                <select {...register("environment_profile_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {envProfiles.map((ep: any) => <option key={ep.id} value={ep.id}>{ep.profile_name}</option>)}
                </select>
              </Field>
              <Field label="Own Ship (Primary Vessel)" error={errors.primary_vessel_id?.message}>
                <select {...register("primary_vessel_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {vessels.map((v: any) => <option key={v.id} value={v.id}>{v.vessel_name}</option>)}
                </select>
              </Field>
              <Field label="Target Ship (Secondary)" error={errors.secondary_vessel_id?.message}>
                <select {...register("secondary_vessel_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {vessels.map((v: any) => <option key={v.id} value={v.id}>{v.vessel_name}</option>)}
                </select>
              </Field>
              <Field label="Additional Ship (Tertiary)" error={errors.tertiary_vessel_id?.message}>
                <select {...register("tertiary_vessel_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {vessels.map((v: any) => <option key={v.id} value={v.id}>{v.vessel_name}</option>)}
                </select>
              </Field>
              <Field label="Duration (min)" error={errors.duration_minutes?.message}>
                <input {...register("duration_minutes")} type="number" min="1" placeholder="e.g. 45" className={inputClass} />
              </Field>
              <Field label="Passing Score (%)" error={errors.passing_score?.message}>
                <input {...register("passing_score")} type="number" step="0.01" min="0" max="100" placeholder="e.g. 70" className={inputClass} />
              </Field>
              <Field label="Status" required error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
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
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Variant"}
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
                {["Sr No", "Variant Name", "Exercise", "Port", "Environment Profile", "Primary Vessel", "Duration", "Status", "Updated", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">No variants found.</td></tr>
              ) : items.map((v, idx) => (
                <tr key={v.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{v.variant_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">{v.exercise_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{v.port_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">{v.environment_profile_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">{v.primary_vessel_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{v.duration_minutes ? `${v.duration_minutes} min` : "—"}</td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[v.status] ?? statusColors.draft)}>{v.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(v.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditItem(v); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      {v.status !== "active" && (
                        <button onClick={() => activateMutation.mutate(v.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Activate"><Power className="w-3.5 h-3.5" /></button>
                      )}
                      {v.status !== "archived" && (
                        <button onClick={() => archiveMutation.mutate(v.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => duplicateMutation.mutate(v.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(v)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>{total === 0 ? "No records" : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">Previous</button>
            <span className="px-3 py-1 text-xs self-center">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>

      <ConfirmModal open={!!deleteTarget} title="Delete Variant" description={`Delete "${deleteTarget?.variant_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
