"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { planService } from "@/services/plans.service";
import type { Plan } from "@/types/plan.types";
import { BILLING_CYCLES, PLAN_STATUSES } from "@/types/plan.types";

const schema = z.object({
  plan_name: z.string().min(1, "Required"),
  plan_code: z.string().min(1, "Required").regex(/^[A-Z0-9_\-]+$/, "Uppercase letters, numbers, _ or - only"),
  description: z.string().optional(),
  monthly_price: z.coerce.number().min(0),
  yearly_price: z.coerce.number().min(0),
  billing_cycle: z.enum(["Monthly", "Yearly", "Custom"]),
  max_users: z.coerce.number().int().min(-1),
  max_candidates: z.coerce.number().int().min(-1),
  max_assessments_per_month: z.coerce.number().int().min(-1),
  max_storage_gb: z.coerce.number().int().min(-1),
  max_simulators: z.coerce.number().int().min(-1),
  certificate_enabled: z.boolean(),
  ai_enabled: z.boolean(),
  offline_enabled: z.boolean(),
  custom_exercises_enabled: z.boolean(),
  status: z.enum(["Draft", "Active", "Archived"]),
  is_public: z.boolean(),
  display_order: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  plan?: Plan | null;
}

export function PlanFormDialog({ open, onClose, plan }: Props) {
  const qc = useQueryClient();
  const isEdit = !!plan;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plan_name: "", plan_code: "", description: "", monthly_price: 0, yearly_price: 0,
      billing_cycle: "Monthly", max_users: 10, max_candidates: 50, max_assessments_per_month: 10,
      max_storage_gb: 5, max_simulators: 1, certificate_enabled: false, ai_enabled: false,
      offline_enabled: false, custom_exercises_enabled: false, status: "Draft", is_public: false, display_order: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (plan) {
        reset({
          plan_name: plan.plan_name, plan_code: plan.plan_code, description: plan.description ?? "",
          monthly_price: plan.monthly_price, yearly_price: plan.yearly_price, billing_cycle: plan.billing_cycle,
          max_users: plan.max_users, max_candidates: plan.max_candidates,
          max_assessments_per_month: plan.max_assessments_per_month, max_storage_gb: plan.max_storage_gb,
          max_simulators: plan.max_simulators, certificate_enabled: plan.certificate_enabled,
          ai_enabled: plan.ai_enabled, offline_enabled: plan.offline_enabled,
          custom_exercises_enabled: plan.custom_exercises_enabled, status: plan.status,
          is_public: plan.is_public, display_order: plan.display_order,
        });
      } else {
        reset({
          plan_name: "", plan_code: "", description: "", monthly_price: 0, yearly_price: 0,
          billing_cycle: "Monthly", max_users: 10, max_candidates: 50, max_assessments_per_month: 10,
          max_storage_gb: 5, max_simulators: 1, certificate_enabled: false, ai_enabled: false,
          offline_enabled: false, custom_exercises_enabled: false, status: "Draft", is_public: false, display_order: 0,
        });
      }
    }
  }, [open, plan, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEdit && plan) {
        const { plan_code: _c, ...rest } = data;
        return planService.update(plan.uuid, rest);
      }
      return planService.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      onClose();
    },
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  const boolField = (name: keyof FormValues, label: string) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Switch
        checked={watch(name) as boolean}
        onCheckedChange={(v) => setValue(name, v)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Plan" : "Create Plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Step 1 — Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plan Name</Label>
                <Input {...register("plan_name")} className="bg-background border-border" placeholder="Enterprise" />
                {errors.plan_name && <p className="text-xs text-destructive">{errors.plan_name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Plan Code {isEdit && <span className="text-muted-foreground">(read-only)</span>}</Label>
                <Input {...register("plan_code")} disabled={isEdit} className="bg-background border-border" placeholder="ENTERPRISE" />
                {errors.plan_code && <p className="text-xs text-destructive">{errors.plan_code.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea {...register("description")} className="bg-background border-border resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Monthly Price ($)</Label>
                <Input {...register("monthly_price")} type="number" step="0.01" className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label>Yearly Price ($)</Label>
                <Input {...register("yearly_price")} type="number" step="0.01" className="bg-background border-border" />
              </div>
              <div className="space-y-1">
                <Label>Billing Cycle</Label>
                <Select value={watch("billing_cycle")} onValueChange={(v) => setValue("billing_cycle", v as any)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface border-border">
                    {BILLING_CYCLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2 — Limits */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limits (-1 = unlimited)</h3>
            <div className="grid grid-cols-3 gap-3">
              {(["max_users", "max_candidates", "max_assessments_per_month", "max_storage_gb", "max_simulators", "display_order"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label>{field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
                  <Input {...register(field)} type="number" className="bg-background border-border" />
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 — Features & Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature Flags</h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 bg-background">
              {boolField("certificate_enabled", "Certificates")}
              {boolField("ai_enabled", "AI Features")}
              {boolField("offline_enabled", "Offline Mode")}
              {boolField("custom_exercises_enabled", "Custom Exercises")}
              {boolField("is_public", "Public (visible on pricing page)")}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as any)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-surface border-border">
                {PLAN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {mutation.error && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
