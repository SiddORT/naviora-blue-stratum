"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Copy, Archive, Power, X, RefreshCw, ChevronDown } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { exerciseService, categoryService, scenarioService, objectiveService } from "@/services/exercises.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Exercise, ExerciseCategory, Objective, Scenario } from "@/types/exercise.types";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const GENERATION_MODES = ["MANUAL", "RANDOMIZED", "PARAMETERIZED"];

const schema = z.object({
  exercise_name: z.string().min(2, "Name required").max(255),
  exercise_code: z.string().min(2, "Code required").max(50),
  category_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  scenario_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  description: z.string().optional().or(z.literal("")),
  difficulty: z.string().optional().or(z.literal("")),
  passing_score: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(100).nullable().optional()),
  max_attempts: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(1).nullable().optional()),
  estimated_duration: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(1).nullable().optional()),
  generation_mode: z.string().default("MANUAL"),
  status: z.enum(["draft", "active", "archived"]),
  objective_ids: z.array(z.number()).default([]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const filterInput = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};
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

export function ExerciseLibraryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [cloneTarget, setCloneTarget] = useState<Exercise | null>(null);
  const [cloneName, setCloneName] = useState("");
  const pageSize = 20;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["exercises-library", page, search, difficulty, status],
    queryFn: () => exerciseService.list({ page, page_size: pageSize, search: search || undefined, difficulty: difficulty || undefined, status: status || undefined }),
  });

  const { data: categoriesData } = useQuery({ queryKey: ["exercise-categories-all"], queryFn: () => categoryService.listAllActive() });
  const { data: scenariosData } = useQuery({ queryKey: ["exercise-scenarios-all"], queryFn: () => scenarioService.listAllActive() });
  const { data: objectivesData } = useQuery({ queryKey: ["exercise-objectives-all"], queryFn: () => objectiveService.listAllActive() });

  const categories: ExerciseCategory[] = (categoriesData as any)?.data ?? [];
  const scenarios: Scenario[] = (scenariosData as any)?.data ?? [];
  const objectives: Objective[] = (objectivesData as any)?.data ?? [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { generation_mode: "MANUAL", status: "draft", objective_ids: [] },
  });

  const isEdit = !!editItem;
  const nameVal = watch("exercise_name");
  const selectedObjectiveIds = watch("objective_ids");

  useEffect(() => {
    if (formOpen) {
      codeManual.current = false;
      reset(editItem ? {
        exercise_name: editItem.exercise_name, exercise_code: editItem.exercise_code,
        category_id: editItem.category_id ?? undefined, scenario_id: editItem.scenario_id ?? undefined,
        description: editItem.description ?? "", difficulty: editItem.difficulty ?? "",
        passing_score: editItem.passing_score ?? undefined, max_attempts: editItem.max_attempts ?? undefined,
        estimated_duration: editItem.estimated_duration ?? undefined, generation_mode: editItem.generation_mode,
        status: editItem.status as "draft" | "active" | "archived", objective_ids: editItem.objective_ids ?? [],
      } : { generation_mode: "MANUAL", status: "draft", objective_ids: [] });
    }
  }, [formOpen, editItem, reset]);

  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("exercise_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  function toggleObjective(id: number) {
    const current = selectedObjectiveIds ?? [];
    setValue("objective_ids", current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => isEdit ? exerciseService.update(editItem!.uuid, d as any) : exerciseService.create(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises-library"] }); toast({ variant: "success", title: isEdit ? "Exercise updated" : "Exercise created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => exerciseService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises-library"] }); setDeleteTarget(null); toast({ variant: "success", title: "Exercise deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => exerciseService.archive(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises-library"] }); toast({ variant: "success", title: "Exercise archived" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const activateMutation = useMutation({
    mutationFn: (uuid: string) => exerciseService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises-library"] }); toast({ variant: "success", title: "Exercise activated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => exerciseService.clone(uuid, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercises-library"] }); setCloneTarget(null); setCloneName(""); toast({ variant: "success", title: "Exercise cloned" }); },
    onError: (e: Error) => { setCloneTarget(null); toast({ variant: "destructive", title: "Clone failed", description: e.message }); },
  });

  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: Exercise[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search exercises..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">{isEdit ? "Edit Exercise" : "Add New Exercise"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Exercise Name" required error={errors.exercise_name?.message}>
                  <input {...register("exercise_name")} placeholder="e.g. Crossing Situation Assessment" className={inputClass} />
                </Field>
              </div>
              <Field label="Exercise Code" required error={errors.exercise_code?.message}>
                <input {...register("exercise_code")} placeholder="e.g. CROSS_ASSESS" className={inputClass}
                  onChange={e => { codeManual.current = true; setValue("exercise_code", e.target.value.toUpperCase()); }} />
              </Field>
              <Field label="Category" error={errors.category_id?.message}>
                <select {...register("category_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {categories.map((c: ExerciseCategory) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </Field>
              <Field label="Scenario" error={errors.scenario_id?.message}>
                <select {...register("scenario_id")} className={inputClass}>
                  <option value="">— None —</option>
                  {scenarios.map((s: Scenario) => <option key={s.id} value={s.id}>{s.scenario_name}</option>)}
                </select>
              </Field>
              <Field label="Difficulty" error={errors.difficulty?.message}>
                <select {...register("difficulty")} className={inputClass}>
                  <option value="">— Select —</option>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Passing Score (%)" error={errors.passing_score?.message}>
                <input {...register("passing_score")} type="number" step="0.01" min="0" max="100" placeholder="e.g. 70" className={inputClass} />
              </Field>
              <Field label="Max Attempts" error={errors.max_attempts?.message}>
                <input {...register("max_attempts")} type="number" min="1" placeholder="e.g. 3" className={inputClass} />
              </Field>
              <Field label="Est. Duration (min)" error={errors.estimated_duration?.message}>
                <input {...register("estimated_duration")} type="number" min="1" placeholder="e.g. 45" className={inputClass} />
              </Field>
              <Field label="Generation Mode" error={errors.generation_mode?.message}>
                <select {...register("generation_mode")} className={inputClass}>
                  {GENERATION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
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

            {objectives.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Objectives</p>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((o: Objective) => {
                    const selected = (selectedObjectiveIds ?? []).includes(o.id);
                    return (
                      <button key={o.id} type="button" onClick={() => toggleObjective(o.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground")}>
                        {o.objective_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={closeForm} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Exercise"}
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
                {["Sr No", "Exercise Name", "Category", "Scenario", "Difficulty", "Variants", "Status", "Ver.", "Updated", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">No exercises found.</td></tr>
              ) : items.map((e, idx) => (
                <tr key={e.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{e.exercise_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.category_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{e.scenario_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {e.difficulty ? <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", diffColors[e.difficulty] ?? "bg-muted text-muted-foreground")}>{e.difficulty}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground font-mono text-xs">{e.variant_count}</td>
                  <td className="px-4 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColors[e.status] ?? statusColors.draft)}>{e.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">v{e.version_number}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(e.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditItem(e); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      {e.status !== "active" && (
                        <button onClick={() => activateMutation.mutate(e.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Activate"><Power className="w-3.5 h-3.5" /></button>
                      )}
                      {e.status !== "archived" && (
                        <button onClick={() => archiveMutation.mutate(e.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => { setCloneTarget(e); setCloneName(`${e.exercise_name} (Copy)`); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Clone"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <ConfirmModal open={!!deleteTarget} title="Delete Exercise" description={`Delete "${deleteTarget?.exercise_name}"? This cannot be undone.`} confirmLabel="Delete" variant="destructive" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)} onCancel={() => setDeleteTarget(null)} />

      {cloneTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Clone Exercise</h3>
              <button onClick={() => setCloneTarget(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Cloning <span className="text-foreground font-medium">{cloneTarget.exercise_name}</span>. Enter a name for the new exercise:</p>
              <input type="text" value={cloneName} onChange={e => setCloneName(e.target.value)} placeholder="New exercise name..." className={inputClass} />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setCloneTarget(null)} className="px-5 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button disabled={!cloneName.trim() || cloneMutation.isPending} onClick={() => cloneMutation.mutate({ uuid: cloneTarget.uuid, name: cloneName.trim() })}
                className="flex items-center gap-2 px-5 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {cloneMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
