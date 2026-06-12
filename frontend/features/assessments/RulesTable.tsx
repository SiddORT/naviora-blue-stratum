"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { assessmentRuleService, assessmentTemplateService } from "@/services/assessments.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { AssessmentRule, AssessmentTemplate } from "@/types/assessment.types";

const schema = z.object({
  assessment_id: z.coerce.number().min(1, "Assessment required"),
  minimum_pass_score: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  max_attempts: z.coerce.number().min(1).optional().or(z.literal("")),
  assessment_duration: z.coerce.number().min(1).optional().or(z.literal("")),
  allow_reassessment: z.boolean().default(true),
  reassessment_wait_days: z.coerce.number().min(0).optional().or(z.literal("")),
  variant_selection_mode: z.enum(["MANUAL", "RANDOM", "ALL_VARIANTS"]).default("MANUAL"),
  randomize_exercises: z.boolean().default(false),
  randomize_variants: z.boolean().default(false),
  auto_fail_on_collision: z.boolean().default(false),
  auto_fail_on_major_violation: z.boolean().default(false),
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

function BoolField({ label, name, register }: { label: string; name: keyof FormData; register: any }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={name} {...register(name)} className="w-4 h-4 accent-primary" />
      <label htmlFor={name} className="text-sm text-foreground">{label}</label>
    </div>
  );
}

export function RulesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssessmentRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentRule | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["assessment-rules", page, search],
    queryFn: () => assessmentRuleService.list({ page, page_size: pageSize, search: search || undefined }),
  });

  const { data: templatesData } = useQuery({
    queryKey: ["assessment-templates-all"],
    queryFn: () => assessmentTemplateService.listAllActive(),
  });

  const templates: AssessmentTemplate[] = (templatesData?.data as AssessmentTemplate[]) ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { allow_reassessment: true, variant_selection_mode: "MANUAL" },
  });

  const isEdit = !!editItem;

  function openForm(item?: AssessmentRule) {
    setEditItem(item ?? null);
    if (item) {
      reset({
        assessment_id: item.assessment_id,
        minimum_pass_score: item.minimum_pass_score ?? "",
        max_attempts: item.max_attempts ?? "",
        assessment_duration: item.assessment_duration ?? "",
        allow_reassessment: item.allow_reassessment,
        reassessment_wait_days: item.reassessment_wait_days ?? "",
        variant_selection_mode: item.variant_selection_mode as "MANUAL" | "RANDOM" | "ALL_VARIANTS",
        randomize_exercises: item.randomize_exercises,
        randomize_variants: item.randomize_variants,
        auto_fail_on_collision: item.auto_fail_on_collision,
        auto_fail_on_major_violation: item.auto_fail_on_major_violation,
      });
    } else {
      reset({ allow_reassessment: true, variant_selection_mode: "MANUAL" });
    }
    setFormOpen(true);
  }

  function closeForm() { setFormOpen(false); setEditItem(null); }

  function cleanNum(v: unknown) { return v === "" || v === undefined ? undefined : Number(v); }

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => {
      const payload = {
        ...d,
        minimum_pass_score: cleanNum(d.minimum_pass_score),
        max_attempts: cleanNum(d.max_attempts),
        assessment_duration: cleanNum(d.assessment_duration),
        reassessment_wait_days: cleanNum(d.reassessment_wait_days),
      };
      return isEdit ? assessmentRuleService.update(editItem!.uuid, payload) : assessmentRuleService.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-rules"] }); toast({ variant: "success", title: isEdit ? "Rule updated" : "Rule created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => assessmentRuleService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-rules"] }); setDeleteTarget(null); toast({ variant: "success", title: "Rule deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const paged = data?.data;
  const items: AssessmentRule[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search rules..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <button onClick={() => openForm()} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {formOpen && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{isEdit ? "Edit Assessment Rule" : "New Assessment Rule"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Assessment" required error={errors.assessment_id?.message}>
                <select {...register("assessment_id")} className={inputClass} disabled={isEdit}>
                  <option value="">Select assessment...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.assessment_name} ({t.assessment_code})</option>)}
                </select>
              </Field>
              <Field label="Variant Selection Mode" error={errors.variant_selection_mode?.message}>
                <select {...register("variant_selection_mode")} className={inputClass}>
                  <option value="MANUAL">Manual</option>
                  <option value="RANDOM">Random</option>
                  <option value="ALL_VARIANTS">All Variants</option>
                </select>
              </Field>
              <Field label="Min Pass Score (%)" error={errors.minimum_pass_score?.message}>
                <input type="number" {...register("minimum_pass_score")} className={inputClass} placeholder="e.g. 70" min="0" max="100" />
              </Field>
              <Field label="Max Attempts" error={errors.max_attempts?.message}>
                <input type="number" {...register("max_attempts")} className={inputClass} placeholder="e.g. 3" min="1" />
              </Field>
              <Field label="Duration (minutes)" error={errors.assessment_duration?.message}>
                <input type="number" {...register("assessment_duration")} className={inputClass} placeholder="e.g. 60" min="1" />
              </Field>
              <Field label="Reassessment Wait (days)" error={errors.reassessment_wait_days?.message}>
                <input type="number" {...register("reassessment_wait_days")} className={inputClass} placeholder="e.g. 7" min="0" />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <BoolField label="Allow Reassessment" name="allow_reassessment" register={register} />
              <BoolField label="Randomize Exercises" name="randomize_exercises" register={register} />
              <BoolField label="Randomize Variants" name="randomize_variants" register={register} />
              <BoolField label="Auto-fail on Collision" name="auto_fail_on_collision" register={register} />
              <BoolField label="Auto-fail on Major Violation" name="auto_fail_on_major_violation" register={register} />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-gold text-black hover:opacity-90 disabled:opacity-50 transition-opacity">
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["#", "Assessment", "Pass Score", "Max Attempts", "Duration", "Variant Mode", "Reassessment", "Updated", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No rules found.</td></tr>
              ) : items.map((item, idx) => (
                <tr key={item.uuid} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div>{item.assessment_name ?? "—"}</div>
                    {item.assessment_code && <div className="font-mono text-xs text-muted-foreground">{item.assessment_code}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.minimum_pass_score != null ? `${item.minimum_pass_score}%` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.max_attempts ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.assessment_duration != null ? `${item.assessment_duration}m` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{item.variant_selection_mode}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{item.allow_reassessment ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(item.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openForm(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
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
        title="Delete Rule"
        description={`Delete rule for "${deleteTarget?.assessment_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
