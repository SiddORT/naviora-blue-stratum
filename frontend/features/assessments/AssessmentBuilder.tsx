"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Info, Dumbbell, Settings, CalendarRange, ClipboardCheck,
  ChevronRight, ChevronLeft, Check, X, Plus, Trash2,
  GripVertical, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { assessmentService } from "@/services/assessments.service";
import { exerciseService } from "@/services/exercises.service";
import { ASSESSMENT_TYPES } from "@/types/assessment.types";
import type { AssessmentExerciseCreate, AssessmentCreatePayload } from "@/types/assessment.types";

// ── Schema ────────────────────────────────────────────────────────────────────

const infoSchema = z.object({
  assessment_name: z.string().min(2, "Name required"),
  assessment_code: z.string().min(2, "Code required").toUpperCase(),
  assessment_type: z.enum(["Training", "Evaluation", "Certification", "Practice"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
});

const settingsSchema = z.object({
  duration_minutes: z.coerce.number().int().positive().optional().or(z.literal("")),
  passing_score: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  max_attempts: z.coerce.number().int().positive().optional().or(z.literal("")),
  randomize_exercise_order: z.boolean().default(false),
  randomize_variant_selection: z.boolean().default(false),
  certificate_eligible: z.boolean().default(false),
  certificate_validity_months: z.coerce.number().int().positive().optional().or(z.literal("")),
});

type InfoForm = z.infer<typeof infoSchema>;
type SettingsForm = z.infer<typeof settingsSchema>;

// ── Styles ────────────────────────────────────────────────────────────────────

const inputClass = cn(
  "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
);

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Info",       icon: Info },
  { id: 2, label: "Exercises",  icon: Dumbbell },
  { id: 3, label: "Settings",   icon: Settings },
  { id: 4, label: "Schedule",   icon: CalendarRange },
  { id: 5, label: "Review",     icon: ClipboardCheck },
];

function toCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AssessmentBuilder() {
  const router = useRouter();
  const params = useSearchParams();
  const editUuid = params.get("uuid");
  const isEdit = !!editUuid;
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedExercises, setSelectedExercises] = useState<AssessmentExerciseCreate[]>([]);
  const [scheduleData, setScheduleData] = useState({
    start_date: "", end_date: "", timezone: "UTC", duration_override: "", is_open: false,
  });

  // ── Info form ─────────────────────────────────────────────────────────────

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: { assessment_type: "Training" },
  });
  const nameVal = infoForm.watch("assessment_name");

  useEffect(() => {
    if (!isEdit && nameVal) infoForm.setValue("assessment_code", toCode(nameVal));
  }, [nameVal, isEdit, infoForm]);

  // ── Settings form ─────────────────────────────────────────────────────────

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      randomize_exercise_order: false,
      randomize_variant_selection: false,
      certificate_eligible: false,
    },
  });
  const certEligible = settingsForm.watch("certificate_eligible");

  // ── Load existing (edit mode) ─────────────────────────────────────────────

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["assessment-detail", editUuid],
    queryFn: () => assessmentService.get(editUuid!).then(r => r.data),
    enabled: !!editUuid,
  });

  useEffect(() => {
    if (!existing) return;
    infoForm.reset({
      assessment_name: existing.assessment_name,
      assessment_code: existing.assessment_code,
      assessment_type: existing.assessment_type,
      description: existing.description ?? "",
      instructions: existing.instructions ?? "",
    });
    settingsForm.reset({
      duration_minutes: existing.duration_minutes ?? "",
      passing_score: existing.passing_score ?? "",
      max_attempts: existing.max_attempts ?? "",
      randomize_exercise_order: existing.randomize_exercise_order,
      randomize_variant_selection: existing.randomize_variant_selection,
      certificate_eligible: existing.certificate_eligible,
      certificate_validity_months: existing.certificate_validity_months ?? "",
    });
    setSelectedExercises(
      existing.exercises.map(e => ({
        exercise_id: e.exercise_id,
        sequence_number: e.sequence_number,
        weightage: e.weightage,
        mandatory: e.mandatory,
      }))
    );
  }, [existing, infoForm, settingsForm]);

  // ── Exercise library ──────────────────────────────────────────────────────

  const [exSearch, setExSearch] = useState("");

  const { data: exerciseData } = useQuery({
    queryKey: ["exercises-all-active"],
    queryFn: () => exerciseService.listAllActive().then(r => r.data),
  });

  const filteredExercises = (exerciseData ?? []).filter(e => {
    if (!exSearch) return true;
    const s = exSearch.toLowerCase();
    return e.exercise_name.toLowerCase().includes(s) || e.exercise_code.toLowerCase().includes(s);
  });

  const isSelected = (id: number) => selectedExercises.some(e => e.exercise_id === id);

  function toggleExercise(id: number) {
    setSelectedExercises(prev => {
      if (prev.some(e => e.exercise_id === id)) {
        return prev.filter(e => e.exercise_id !== id).map((e, i) => ({ ...e, sequence_number: i + 1 }));
      }
      return [...prev, { exercise_id: id, sequence_number: prev.length + 1, weightage: 0, mandatory: true }];
    });
  }

  function updateExerciseField(idx: number, field: keyof AssessmentExerciseCreate, value: number | boolean) {
    setSelectedExercises(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function removeExercise(idx: number) {
    setSelectedExercises(prev => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sequence_number: i + 1 })));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const info = infoForm.getValues();
      const settings = settingsForm.getValues();
      const payload: AssessmentCreatePayload = {
        assessment_name: info.assessment_name,
        assessment_code: info.assessment_code,
        assessment_type: info.assessment_type,
        description: info.description || undefined,
        instructions: info.instructions || undefined,
        duration_minutes: settings.duration_minutes ? Number(settings.duration_minutes) : undefined,
        passing_score: settings.passing_score ? Number(settings.passing_score) : undefined,
        max_attempts: settings.max_attempts ? Number(settings.max_attempts) : undefined,
        randomize_exercise_order: settings.randomize_exercise_order,
        randomize_variant_selection: settings.randomize_variant_selection,
        certificate_eligible: settings.certificate_eligible,
        certificate_validity_months: settings.certificate_validity_months ? Number(settings.certificate_validity_months) : undefined,
        exercises: selectedExercises,
      };
      if (isEdit) {
        return assessmentService.update(editUuid!, payload);
      }
      const res = await assessmentService.create(payload);
      const uuid = res.data.uuid;
      // Save schedule if provided
      if (scheduleData.start_date || scheduleData.end_date || scheduleData.is_open) {
        await assessmentService.upsertSchedule(uuid, {
          start_date: scheduleData.start_date || undefined,
          end_date: scheduleData.end_date || undefined,
          timezone: scheduleData.timezone,
          duration_override: scheduleData.duration_override ? Number(scheduleData.duration_override) : undefined,
          is_open: scheduleData.is_open,
        } as any);
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast({ variant: "success", title: isEdit ? "Assessment updated" : "Assessment created" });
      router.push("/admin/assessments");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  // ── Step navigation ───────────────────────────────────────────────────────

  async function goNext() {
    if (step === 1) {
      const ok = await infoForm.trigger();
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await settingsForm.trigger();
      if (!ok) return;
    }
    if (step < STEPS.length) setStep(s => s + 1);
  }

  function goBack() {
    if (step > 1) setStep(s => s - 1);
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading assessment...
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => done && setStep(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active && "text-foreground",
                  done && "text-primary cursor-pointer hover:bg-primary/10",
                  !active && !done && "text-muted-foreground cursor-default",
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  active && "bg-primary text-black",
                  done && "bg-primary/20 text-primary",
                  !active && !done && "bg-muted text-muted-foreground",
                )}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px mx-2", done ? "bg-primary/40" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 min-h-[400px]">
        {/* Step 1 — Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Assessment Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Define the core identity and type of this assessment.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Assessment Name" required error={infoForm.formState.errors.assessment_name?.message}>
                  <input {...infoForm.register("assessment_name")} placeholder="e.g. Bridge Watch Competency Evaluation" className={inputClass} />
                </Field>
              </div>
              <Field label="Assessment Code" required error={infoForm.formState.errors.assessment_code?.message}>
                <input {...infoForm.register("assessment_code")} placeholder="e.g. BWCE-001" className={inputClass}
                  onChange={e => infoForm.setValue("assessment_code", e.target.value.toUpperCase())} />
              </Field>
              <Field label="Assessment Type" required error={infoForm.formState.errors.assessment_type?.message}>
                <select {...infoForm.register("assessment_type")} className={inputClass}>
                  {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" error={infoForm.formState.errors.description?.message}>
                  <textarea {...infoForm.register("description")} rows={3} placeholder="Brief description of this assessment..." className={cn(inputClass, "resize-none")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Instructions" error={infoForm.formState.errors.instructions?.message}>
                  <textarea {...infoForm.register("instructions")} rows={3} placeholder="Instructions shown to participants before starting..." className={cn(inputClass, "resize-none")} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Exercises */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Select Exercises</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose exercises and configure weightage and ordering.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Exercise library */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exercise Library</h3>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  className={inputClass}
                />
                <div className="rounded-lg border border-border overflow-y-auto max-h-72 divide-y divide-border">
                  {filteredExercises.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No exercises found</div>
                  ) : filteredExercises.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => toggleExercise(ex.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm transition-colors",
                        isSelected(ex.id) ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border text-xs transition-colors",
                        isSelected(ex.id) ? "bg-primary border-primary text-black" : "border-border",
                      )}>
                        {isSelected(ex.id) && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{ex.exercise_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ex.exercise_code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected exercises */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selected ({selectedExercises.length})
                </h3>
                <div className="rounded-lg border border-border overflow-y-auto max-h-80 divide-y divide-border">
                  {selectedExercises.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No exercises selected</div>
                  ) : selectedExercises.map((sel, idx) => {
                    const ex = (exerciseData ?? []).find(e => e.id === sel.exercise_id);
                    return (
                      <div key={sel.exercise_id} className="px-3 py-2.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}.</span>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">{ex?.exercise_name ?? `Exercise #${sel.exercise_id}`}</span>
                          <button type="button" onClick={() => removeExercise(idx)}
                            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 pl-8">
                          <label className="text-xs text-muted-foreground">Weight %</label>
                          <input
                            type="number" min={0} max={100} step={1}
                            value={sel.weightage}
                            onChange={e => updateExerciseField(idx, "weightage", Number(e.target.value))}
                            className="w-20 bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sel.mandatory}
                              onChange={e => updateExerciseField(idx, "mandatory", e.target.checked)}
                              className="w-3.5 h-3.5 accent-primary"
                            />
                            Mandatory
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Assessment Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure duration, pass criteria, and behaviour.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Duration (minutes)" error={settingsForm.formState.errors.duration_minutes?.message}>
                <input type="number" {...settingsForm.register("duration_minutes")} min={1} placeholder="e.g. 60" className={inputClass} />
              </Field>
              <Field label="Passing Score (%)" error={settingsForm.formState.errors.passing_score?.message}>
                <input type="number" {...settingsForm.register("passing_score")} min={0} max={100} step={0.1} placeholder="e.g. 70" className={inputClass} />
              </Field>
              <Field label="Max Attempts" error={settingsForm.formState.errors.max_attempts?.message}>
                <input type="number" {...settingsForm.register("max_attempts")} min={1} placeholder="e.g. 3" className={inputClass} />
              </Field>
              <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...settingsForm.register("randomize_exercise_order")} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-foreground">Randomize exercise order</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...settingsForm.register("randomize_variant_selection")} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-foreground">Randomize variant selection</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...settingsForm.register("certificate_eligible")} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-foreground">Certificate eligible</span>
                </label>
              </div>
              {certEligible && (
                <Field label="Certificate Validity (months)" error={settingsForm.formState.errors.certificate_validity_months?.message}>
                  <input type="number" {...settingsForm.register("certificate_validity_months")} min={1} placeholder="e.g. 12" className={inputClass} />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Schedule */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Scheduling</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Set availability window for this assessment (optional).</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date">
                <input type="datetime-local" value={scheduleData.start_date}
                  onChange={e => setScheduleData(d => ({ ...d, start_date: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="End Date">
                <input type="datetime-local" value={scheduleData.end_date}
                  onChange={e => setScheduleData(d => ({ ...d, end_date: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Timezone">
                <input type="text" value={scheduleData.timezone}
                  onChange={e => setScheduleData(d => ({ ...d, timezone: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Duration Override (minutes)">
                <input type="number" min={1} value={scheduleData.duration_override}
                  onChange={e => setScheduleData(d => ({ ...d, duration_override: e.target.value }))} className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={scheduleData.is_open}
                    onChange={e => setScheduleData(d => ({ ...d, is_open: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-foreground">Open assessment (no fixed window)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Review & Save</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Confirm details before saving. Assessment will be saved as Draft.</p>
            </div>
            {(() => {
              const info = infoForm.getValues();
              const sett = settingsForm.getValues();
              return (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-muted-foreground">Name: </span><span className="text-foreground font-medium">{info.assessment_name}</span></div>
                      <div><span className="text-muted-foreground">Code: </span><span className="font-mono text-foreground">{info.assessment_code}</span></div>
                      <div><span className="text-muted-foreground">Type: </span><span className="text-foreground">{info.assessment_type}</span></div>
                    </div>
                    {info.description && <p className="text-xs text-muted-foreground mt-1">{info.description}</p>}
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Exercises ({selectedExercises.length})
                    </h3>
                    {selectedExercises.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No exercises selected</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedExercises.map((sel, idx) => {
                          const ex = (exerciseData ?? []).find(e => e.id === sel.exercise_id);
                          return (
                            <div key={sel.exercise_id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="w-4 text-right">{idx + 1}.</span>
                              <span className="text-foreground font-medium">{ex?.exercise_name ?? `Exercise #${sel.exercise_id}`}</span>
                              <span>— {sel.weightage}% weight</span>
                              {sel.mandatory && <span className="text-primary">mandatory</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-muted-foreground">Duration: </span><span className="text-foreground">{sett.duration_minutes ? `${sett.duration_minutes} min` : "—"}</span></div>
                      <div><span className="text-muted-foreground">Pass Score: </span><span className="text-foreground">{sett.passing_score ? `${sett.passing_score}%` : "—"}</span></div>
                      <div><span className="text-muted-foreground">Max Attempts: </span><span className="text-foreground">{sett.max_attempts || "—"}</span></div>
                      <div><span className="text-muted-foreground">Certificate: </span><span className="text-foreground">{sett.certificate_eligible ? "Yes" : "No"}</span></div>
                      <div><span className="text-muted-foreground">Randomize: </span><span className="text-foreground">{sett.randomize_exercise_order ? "Yes" : "No"}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => step === 1 ? router.push("/admin/assessments") : goBack()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < STEPS.length ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2 rounded-lg gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Create Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}
