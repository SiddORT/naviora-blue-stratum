"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { scenarioService } from "@/services/exercises.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Scenario } from "@/types/exercise.types";

const SCENARIO_TYPES = [
  "Head-On", "Crossing", "Overtaking", "Restricted Visibility",
  "Traffic Separation Scheme", "Port Entry", "Port Exit", "Pilotage",
  "Multi Vessel Encounter", "Emergency Response", "Engine Failure",
  "Steering Failure", "Man Overboard",
];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const schema = z.object({
  scenario_name: z.string().min(2, "Name required").max(255),
  scenario_code: z.string().min(2, "Code required").max(50),
  scenario_type: z.string().optional().or(z.literal("")),
  difficulty: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const filterInput = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const statusColors: Record<string, string> = { active: "bg-green-500/15 text-green-600 dark:text-green-400", inactive: "bg-muted text-muted-foreground" };
const diffColors: Record<string, string> = {
  Beginner: "bg-blue-500/15 text-blue-500",
  Intermediate: "bg-yellow-500/15 text-yellow-600",
  Advanced: "bg-orange-500/15 text-orange-500",
  Expert: "bg-red-500/15 text-red-500",
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

export function ScenariosTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Scenario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["exercise-scenarios", page, search, scenarioType, difficulty, status],
    queryFn: () => scenarioService.list({ page, page_size: pageSize, search: search || undefined, scenario_type: scenarioType || undefined, difficulty: difficulty || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const isEdit = !!editItem;
  const nameVal = watch("scenario_name");

  useEffect(() => {
    if (formOpen) {
      codeManual.current = false;
      reset(editItem ? {
        scenario_name: editItem.scenario_name, scenario_code: editItem.scenario_code,
        scenario_type: editItem.scenario_type ?? "", difficulty: editItem.difficulty ?? "",
        description: editItem.description ?? "", status: editItem.status as "active" | "inactive",
      } : { status: "active" });
    }
  }, [formOpen, editItem, reset]);

  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("scenario_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => isEdit ? scenarioService.update(editItem!.uuid, d) : scenarioService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-scenarios"] }); toast({ variant: "success", title: isEdit ? "Scenario updated" : "Scenario created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => scenarioService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-scenarios"] }); setDeleteTarget(null); toast({ variant: "success", title: "Scenario deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? scenarioService.deactivate(uuid) : scenarioService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-scenarios"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: Scenario[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search scenarios..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={scenarioType} onChange={e => { setScenarioType(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Types</option>
          {SCENARIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Scenario
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Scenario" : "Add New Scenario"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Scenario Name" required error={errors.scenario_name?.message}>
                  <input {...register("scenario_name")} placeholder="e.g. Crossing Situation — Day" className={inputClass} />
                </Field>
              </div>
              <Field label="Scenario Code" required error={errors.scenario_code?.message}>
                <input {...register("scenario_code")} placeholder="e.g. CROSS_DAY" className={inputClass}
                  onChange={e => { codeManual.current = true; setValue("scenario_code", e.target.value.toUpperCase()); }} />
              </Field>
              <Field label="Scenario Type" error={errors.scenario_type?.message}>
                <select {...register("scenario_type")} className={inputClass}>
                  <option value="">— Select —</option>
                  {SCENARIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Difficulty" error={errors.difficulty?.message}>
                <select {...register("difficulty")} className={inputClass}>
                  <option value="">— Select —</option>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
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
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Scenario"}
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
                {["Sr No", "Scenario Name", "Code", "Type", "Difficulty", "Status", "Updated", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No scenarios found.</td></tr>
              ) : items.map((s, idx) => (
                <tr key={s.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.scenario_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.scenario_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.scenario_type ?? "—"}</td>
                  <td className="px-4 py-3">
                    {s.difficulty ? <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", diffColors[s.difficulty] ?? "bg-muted text-muted-foreground")}>{s.difficulty}</span> : "—"}
                  </td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[s.status] ?? statusColors.inactive)}>{s.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(s.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditItem(s); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: s.uuid, active: s.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={s.is_active ? "Deactivate" : "Activate"}>
                        {s.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <ConfirmModal open={!!deleteTarget} title="Delete Scenario" description={`Delete "${deleteTarget?.scenario_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
