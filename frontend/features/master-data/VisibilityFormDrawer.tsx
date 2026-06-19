"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibilityService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import type { VisibilityCondition } from "@/types/master-data.types";

const schema = z.object({
  name: z.string().min(2,"Name required").max(100),
  visibility_distance: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active","inactive"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface Props { open: boolean; onClose: () => void; item: VisibilityCondition | null; onSuccess: () => void; }

export function VisibilityFormDrawer({ open, onClose, item, onSuccess }: Props) {
  const isEdit = !!item;
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (open) {
      reset(item ? {
        name: item.name, visibility_distance: item.visibility_distance ?? undefined,
        description: item.description ?? "", status: item.status as "active"|"inactive",
      } : { status: "active" });
    }
  }, [open, item, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? visibilityService.update(item!.uuid, data) : visibilityService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data-visibility"] });
      toast({ variant: "success", title: isEdit ? "Visibility condition updated" : "Visibility condition created" });
      onSuccess(); onClose();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}>
      {open && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />}
      <div className={cn(
        "absolute inset-0 bg-card flex flex-col overflow-hidden transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "Edit Visibility Condition" : "Add Visibility Condition"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex-1 overflow-y-auto"><div className="max-w-5xl mx-auto px-10 py-8 space-y-5">
          <Field label="Name" required error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. Restricted" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Visibility Distance (NM)" error={errors.visibility_distance?.message}>
              <input {...register("visibility_distance")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} rows={3} placeholder="Optional..." className={cn(inputClass,"resize-none")} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </div></form>
      </div>
    </div>
  );
}
