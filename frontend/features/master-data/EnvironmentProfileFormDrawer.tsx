"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { envProfileService, weatherService, seaStateService, visibilityService, timeOfDayService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import type { EnvironmentProfile } from "@/types/master-data.types";

const schema = z.object({
  profile_name: z.string().min(2,"Profile name required").max(255),
  weather_condition_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  sea_state_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  visibility_condition_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
  time_of_day_id: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable().optional()),
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

interface Props { open: boolean; onClose: () => void; item: EnvironmentProfile | null; onSuccess: () => void; }

export function EnvironmentProfileFormDrawer({ open, onClose, item, onSuccess }: Props) {
  const isEdit = !!item;
  const qc = useQueryClient();

  const { data: wData } = useQuery({ queryKey: ["weather-all-active"], queryFn: () => weatherService.listAllActive(), enabled: open });
  const { data: ssData } = useQuery({ queryKey: ["sea-states-all-active"], queryFn: () => seaStateService.listAllActive(), enabled: open });
  const { data: vcData } = useQuery({ queryKey: ["visibility-all-active"], queryFn: () => visibilityService.listAllActive(), enabled: open });
  const { data: todData } = useQuery({ queryKey: ["time-of-day-all-active"], queryFn: () => timeOfDayService.listAllActive(), enabled: open });

  const weatherOptions = wData?.data ?? [];
  const seaStateOptions = ssData?.data ?? [];
  const visibilityOptions = vcData?.data ?? [];
  const timeOfDayOptions = todData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (open) {
      reset(item ? {
        profile_name: item.profile_name,
        weather_condition_id: item.weather_condition_id ?? undefined,
        sea_state_id: item.sea_state_id ?? undefined,
        visibility_condition_id: item.visibility_condition_id ?? undefined,
        time_of_day_id: item.time_of_day_id ?? undefined,
        description: item.description ?? "",
        status: item.status as "active"|"inactive",
      } : { status: "active" });
    }
  }, [open, item, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? envProfileService.update(item!.uuid, data) : envProfileService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data-env-profiles"] });
      toast({ variant: "success", title: isEdit ? "Profile updated" : "Profile created" });
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
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "Edit Environment Profile" : "Add Environment Profile"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex-1 overflow-y-auto"><div className="max-w-5xl mx-auto px-10 py-8 space-y-5">
          <Field label="Profile Name" required error={errors.profile_name?.message}>
            <input {...register("profile_name")} placeholder="e.g. Clear Day Navigation" className={inputClass} />
          </Field>

          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Environmental Components</p>
            <Field label="Weather Condition" error={errors.weather_condition_id?.message}>
              <select {...register("weather_condition_id")} className={inputClass}>
                <option value="">— None —</option>
                {weatherOptions.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Sea State" error={errors.sea_state_id?.message}>
              <select {...register("sea_state_id")} className={inputClass}>
                <option value="">— None —</option>
                {seaStateOptions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Visibility Condition" error={errors.visibility_condition_id?.message}>
              <select {...register("visibility_condition_id")} className={inputClass}>
                <option value="">— None —</option>
                {visibilityOptions.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Time of Day" error={errors.time_of_day_id?.message}>
              <select {...register("time_of_day_id")} className={inputClass}>
                <option value="">— None —</option>
                {timeOfDayOptions.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Status" required error={errors.status?.message}>
            <select {...register("status")} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} rows={3} placeholder="Optional..." className={cn(inputClass,"resize-none")} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Profile"}
            </button>
          </div>
        </div></form>
      </div>
    </div>
  );
}
