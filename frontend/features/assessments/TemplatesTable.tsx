"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Copy, Archive, Eye, X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { assessmentTemplateService, assessmentCategoryService } from "@/services/assessments.service";
import { exerciseService } from "@/services/exercises.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { AssessmentTemplate, AssessmentCategory } from "@/types/assessment.types";
import type { Exercise } from "@/types/exercise.types";
import { useRouter } from "next/navigation";

const stepOneSchema = z.object({
  assessment_name: z.string().min(2, "Name required").max(255),
  assessment_code: z.string().min(2, "Code required").max(50),
  category_id: z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

const stepThreeSchema = z.object({
  passing_score: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().min(1).optional().or(z.literal("")),
  max_attempts: z.coerce.number().min(1).optional().or(z.literal("")),
  variant_selection_mode: z.enum(["MANUAL", "RANDOM", "ALL_VARIANTS"]).default("MANUAL"),
  randomize_exercise_order: z.boolean().default(false),
  randomize_variant_selection: z.boolean().default(false),
});

type StepOneData = z.infer<typeof stepOneSchema>;
type StepThreeData = z.infer<typeof stepThreeSchema>;

interface ExerciseEntry {
  exercise_id: number;
  exercise_name: string;
  exercise_code: string;
  sequence_number: number;
  weightage: number;
  mandatory: boolean;
}

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

const STEPS = ["Assessment Info", "Select Exercises", "Assessment Rules", "Review & Save"];

function WizardPanel({
  editItem,
  onClose,
  onDone,
}: {
  editItem: AssessmentTemplate | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [stepOneData, setStepOneData] = useState<StepOneData | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [stepThreeData, setStepThreeData] = useState<StepThreeData | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editItem;

  const { data: categoriesData } = useQuery({
    queryKey: ["assessment-categories-all"],
    queryFn: () => assessmentCategoryService.listAllActive(),
  });
  const categories: AssessmentCategory[] = (categoriesData?.data as AssessmentCategory[]) ?? [];

  const { data: exercisesData } = useQuery({
    queryKey: ["exercises-all-active"],
    queryFn: () => exerciseService.listAllActive(),
  });
  const allExercises: Exercise[] = (exercisesData?.data as Exercise[]) ?? [];

  const s1 = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: editItem ? {
      assessment_name: editItem.assessment_name,
      assessment_code: editItem.assessment_code,
      category_id: editItem.category_id ?? "",
      description: editItem.description ?? "",
      instructions: editItem.instructions ?? "",
      status: (editItem.status as "draft" | "active" | "archived") ?? "draft",
    } : { status: "draft" },
  });
  const s3 = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues: editItem ? {
      passing_score: editItem.passing_score ?? "",
      duration_minutes: editItem.duration_minutes ?? "",
      max_attempts: editItem.max_attempts ?? "",
      variant_selection_mode: (editItem.variant_selection_mode as "MANUAL" | "RANDOM" | "ALL_VARIANTS") ?? "MANUAL",
      randomize_exercise_order: editItem.randomize_exercise_order ?? false,
      randomize_variant_selection: editItem.randomize_variant_selection ?? false,
    } : { variant_selection_mode: "MANUAL" },
  });

  const nameVal = s1.watch("assessment_name");

  useState(() => {
    if (editItem?.exercises?.length) {
      setExercises(editItem.exercises.map(ae => ({
        exercise_id: ae.exercise_id,
        exercise_name: ae.exercise_name ?? "",
        exercise_code: ae.exercise_code ?? "",
        sequence_number: ae.sequence_number,
        weightage: ae.weightage,
        mandatory: ae.mandatory,
      })));
    }
  });

  function addExercise(ex: Exercise) {
    if (exercises.find(e => e.exercise_id === ex.id)) return;
    setExercises(prev => [...prev, {
      exercise_id: ex.id,
      exercise_name: ex.exercise_name,
      exercise_code: ex.exercise_code,
      sequence_number: prev.length + 1,
      weightage: 0,
      mandatory: true,
    }]);
  }

  function removeExercise(id: number) {
    setExercises(prev => prev.filter(e => e.exercise_id !== id).map((e, i) => ({ ...e, sequence_number: i + 1 })));
  }

  function updateExercise(id: number, field: keyof ExerciseEntry, value: unknown) {
    setExercises(prev => prev.map(e => e.exercise_id === id ? { ...e, [field]: value } : e));
  }

  async function handleS1Next(d: StepOneData) { setStepOneData(d); setStep(1); }
  async function handleS3Next(d: StepThreeData) { setStepThreeData(d); setStep(3); }

  async function handleSave() {
    if (!stepOneData || !stepThreeData) return;
    setSaving(true);
    try {
      const payload = {
        ...stepOneData,
        ...stepThreeData,
        category_id: stepOneData.category_id === "" ? undefined : Number(stepOneData.category_id),
        passing_score: stepThreeData.passing_score === "" ? undefined : Number(stepThreeData.passing_score),
        duration_minutes: stepThreeData.duration_minutes === "" ? undefined : Number(stepThreeData.duration_minutes),
        max_attempts: stepThreeData.max_attempts === "" ? undefined : Number(stepThreeData.max_attempts),
        exercises: exercises.map(e => ({
          exercise_id: e.exercise_id,
          sequence_number: e.sequence_number,
          weightage: e.weightage,
          mandatory: e.mandatory,
        })),
      };
      if (isEdit) {
        await assessmentTemplateService.update(editItem!.uuid, payload);
        toast({ variant: "success", title: "Assessment updated" });
      } else {
        await assessmentTemplateService.create(payload);
        toast({ variant: "success", title: "Assessment created" });
      }
      onDone();
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  const totalWeight = exercises.reduce((s, e) => s + (e.weightage || 0), 0);

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">{isEdit ? "Edit Assessment" : "New Assessment"}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-5 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn("flex items-center gap-2 text-xs font-medium transition-colors", i === step ? "text-primary" : i < step ? "text-green-500" : "text-muted-foreground")}>
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-colors", i === step ? "border-primary bg-primary/10 text-primary" : i < step ? "border-green-500 bg-green-500/10 text-green-500" : "border-border text-muted-foreground")}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-2 transition-colors", i < step ? "bg-green-500/50" : "bg-border")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {step === 0 && (
          <form onSubmit={s1.handleSubmit(handleS1Next)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Assessment Name" required error={s1.formState.errors.assessment_name?.message}>
                <input {...s1.register("assessment_name")} className={inputClass} placeholder="e.g. COLREG Level 1"
                  onBlur={e => { if (!isEdit) s1.setValue("assessment_code", toCode(e.target.value)); }} />
              </Field>
              <Field label="Assessment Code" required error={s1.formState.errors.assessment_code?.message}>
                <input {...s1.register("assessment_code")} className={inputClass} placeholder="e.g. COLREG_L1" />
              </Field>
              <Field label="Category" error={s1.formState.errors.category_id?.message}>
                <select {...s1.register("category_id")} className={inputClass}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </Field>
              <Field label="Status" required error={s1.formState.errors.status?.message}>
                <select {...s1.register("status")} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" error={s1.formState.errors.description?.message}>
                  <textarea {...s1.register("description")} className={cn(inputClass, "resize-none")} rows={2} placeholder="Brief description of this assessment" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Instructions" error={s1.formState.errors.instructions?.message}>
                  <textarea {...s1.register("instructions")} className={cn(inputClass, "resize-none")} rows={3} placeholder="Candidate instructions..." />
                </Field>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Exercises</p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {allExercises.filter(ex => !exercises.find(e => e.exercise_id === ex.id)).map(ex => (
                    <button key={ex.id} onClick={() => addExercise(ex)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left transition-colors group">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ex.exercise_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{ex.exercise_code}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                  {allExercises.filter(ex => !exercises.find(e => e.exercise_id === ex.id)).length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">All exercises added</p>
                  )}
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selected ({exercises.length})</p>
                  {exercises.length > 0 && <p className={cn("text-xs font-medium", Math.abs(totalWeight - 100) < 0.1 ? "text-green-500" : "text-yellow-500")}>Total: {totalWeight.toFixed(1)}%</p>}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {exercises.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No exercises selected</p>}
                  {exercises.map((ex) => (
                    <div key={ex.exercise_id} className="border border-border rounded-lg p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{ex.exercise_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{ex.exercise_code}</p>
                        </div>
                        <button onClick={() => removeExercise(ex.exercise_id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-muted-foreground block mb-1">Seq.</label>
                          <input type="number" value={ex.sequence_number} min={1} onChange={e => updateExercise(ex.exercise_id, "sequence_number", Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Weight %</label>
                          <input type="number" value={ex.weightage} min={0} max={100} step={0.1} onChange={e => updateExercise(ex.exercise_id, "weightage", Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-muted-foreground block mb-1">Mandatory</label>
                          <input type="checkbox" checked={ex.mandatory} onChange={e => updateExercise(ex.exercise_id, "mandatory", e.target.checked)} className="w-4 h-4 mt-1 accent-primary" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(2)} className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={s3.handleSubmit(handleS3Next)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Passing Score (%)" error={s3.formState.errors.passing_score?.message}>
                <input type="number" {...s3.register("passing_score")} className={inputClass} placeholder="e.g. 70" min="0" max="100" />
              </Field>
              <Field label="Duration (minutes)" error={s3.formState.errors.duration_minutes?.message}>
                <input type="number" {...s3.register("duration_minutes")} className={inputClass} placeholder="e.g. 60" min="1" />
              </Field>
              <Field label="Max Attempts" error={s3.formState.errors.max_attempts?.message}>
                <input type="number" {...s3.register("max_attempts")} className={inputClass} placeholder="e.g. 3" min="1" />
              </Field>
              <Field label="Variant Selection Mode" error={s3.formState.errors.variant_selection_mode?.message}>
                <select {...s3.register("variant_selection_mode")} className={inputClass}>
                  <option value="MANUAL">Manual</option>
                  <option value="RANDOM">Random</option>
                  <option value="ALL_VARIANTS">All Variants</option>
                </select>
              </Field>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="reo" {...s3.register("randomize_exercise_order")} className="w-4 h-4 accent-primary" />
                <label htmlFor="reo" className="text-sm text-foreground">Randomize exercise order</label>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="rvs" {...s3.register("randomize_variant_selection")} className="w-4 h-4 accent-primary" />
                <label htmlFor="rvs" className="text-sm text-foreground">Randomize variant selection</label>
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button type="submit" className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </form>
        )}

        {step === 3 && stepOneData && stepThreeData && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assessment Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{stepOneData.assessment_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono">{stepOneData.assessment_code}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[stepOneData.status])}>{stepOneData.status}</span></div>
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rules</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Pass Score</span><span>{stepThreeData.passing_score !== "" ? `${stepThreeData.passing_score}%` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{stepThreeData.duration_minutes !== "" ? `${stepThreeData.duration_minutes} min` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max Attempts</span><span>{stepThreeData.max_attempts !== "" ? stepThreeData.max_attempts : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Variant Mode</span><span className="font-mono text-xs">{stepThreeData.variant_selection_mode}</span></div>
                </div>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exercises ({exercises.length})</p>
              {exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises selected</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-muted-foreground">{["Seq", "Exercise", "Weightage", "Mandatory"].map(h => <th key={h} className="text-left py-1 pr-4">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-border">
                      {[...exercises].sort((a, b) => a.sequence_number - b.sequence_number).map(ex => (
                        <tr key={ex.exercise_id}>
                          <td className="py-2 pr-4 text-muted-foreground">{ex.sequence_number}</td>
                          <td className="py-2 pr-4 font-medium">{ex.exercise_name}</td>
                          <td className="py-2 pr-4">{ex.weightage}%</td>
                          <td className="py-2 pr-4">{ex.mandatory ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving..." : <><Check className="w-4 h-4" /> {isEdit ? "Update Assessment" : "Create Assessment"}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplatesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssessmentTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentTemplate | null>(null);
  const [cloneTarget, setCloneTarget] = useState<AssessmentTemplate | null>(null);
  const [cloneName, setCloneName] = useState("");
  const pageSize = 20;
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["assessment-templates", page, search, status],
    queryFn: () => assessmentTemplateService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => assessmentTemplateService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-templates"] }); setDeleteTarget(null); toast({ variant: "success", title: "Assessment deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => assessmentTemplateService.archive(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-templates"] }); toast({ variant: "success", title: "Assessment archived" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => assessmentTemplateService.clone(uuid, { new_name: name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-templates"] }); setCloneTarget(null); setCloneName(""); toast({ variant: "success", title: "Assessment cloned" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Clone failed", description: e.message }),
  });

  function onDone() { qc.invalidateQueries({ queryKey: ["assessment-templates"] }); setWizardOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: AssessmentTemplate[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search assessments..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => { setEditItem(null); setWizardOpen(true); }} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Assessment
        </button>
      </div>

      {wizardOpen && (
        <WizardPanel editItem={editItem} onClose={() => { setWizardOpen(false); setEditItem(null); }} onDone={onDone} />
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["#", "Assessment Name", "Category", "Exercises", "Pass Score", "Duration", "Status", "Version", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No assessment templates found.</td></tr>
              ) : items.map((item, idx) => (
                <tr key={item.uuid} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{item.assessment_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{item.assessment_code}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category_name ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{item.exercises_count}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.passing_score != null ? `${item.passing_score}%` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.duration_minutes != null ? `${item.duration_minutes}m` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[item.status] ?? "bg-muted text-muted-foreground")}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-center">v{item.version_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/admin/assessments/preview?uuid=${item.uuid}`)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Preview"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditItem(item); setWizardOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setCloneTarget(item); setCloneName(`${item.assessment_name} — Copy`); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Clone"><Copy className="w-3.5 h-3.5" /></button>
                      {item.status !== "archived" && (
                        <button onClick={() => archiveMutation.mutate(item.uuid)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Assessment"
        description={`Delete "${deleteTarget?.assessment_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)}
        onCancel={() => setDeleteTarget(null)}
      />

      {cloneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-foreground">Clone Assessment</h3>
            <p className="text-sm text-muted-foreground">Enter a name for the cloned assessment.</p>
            <input type="text" value={cloneName} onChange={e => setCloneName(e.target.value)} className={inputClass} placeholder="New assessment name" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCloneTarget(null); setCloneName(""); }} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => cloneMutation.mutate({ uuid: cloneTarget.uuid, name: cloneName })} disabled={!cloneName.trim() || cloneMutation.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-gold text-black hover:opacity-90 disabled:opacity-50">Clone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
