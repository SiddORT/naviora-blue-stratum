"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { portService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import type { Port } from "@/types/master-data.types";

const TRAFFIC = ["Low","Medium","High","Very High"];

const schema = z.object({
  port_name: z.string().min(2,"Name must be at least 2 characters").max(255),
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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface Props { open: boolean; onClose: () => void; item: Port | null; onSuccess: () => void; }

export function PortFormDrawer({ open, onClose, item, onSuccess }: Props) {
  const isEdit = !!item;
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { traffic_density: "Medium", status: "active" },
  });

  useEffect(() => {
    if (open) {
      reset(item ? {
        port_name: item.port_name, port_code: item.port_code, country: item.country,
        city: item.city ?? "", latitude: item.latitude ?? undefined, longitude: item.longitude ?? undefined,
        traffic_density: item.traffic_density, description: item.description ?? "",
        status: item.status as "active"|"inactive",
      } : { traffic_density: "Medium", status: "active" });
    }
  }, [open, item, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit ? portService.update(item!.uuid, data) : portService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data-ports"] });
      toast({ variant: "success", title: isEdit ? "Port updated" : "Port created" });
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
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "Edit Port" : "Add Port"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex-1 overflow-y-auto"><div className="max-w-5xl mx-auto px-10 py-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Port Name" required error={errors.port_name?.message}>
                <input {...register("port_name")} placeholder="e.g. Port of Singapore" className={inputClass} />
              </Field>
            </div>
            <Field label="Port Code" required error={errors.port_code?.message}>
              <input {...register("port_code")} placeholder="e.g. SGSIN"
                className={inputClass} onChange={e => { const v = e.target.value.toUpperCase(); e.target.value = v; }} />
            </Field>
            <Field label="Traffic Density" required error={errors.traffic_density?.message}>
              <select {...register("traffic_density")} className={inputClass}>
                {TRAFFIC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Country" required error={errors.country?.message}>
              <input {...register("country")} placeholder="e.g. Singapore" className={inputClass} />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <input {...register("city")} placeholder="e.g. Singapore" className={inputClass} />
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
            <div className="col-span-2">
              <Field label="Description" error={errors.description?.message}>
                <textarea {...register("description")} rows={3} placeholder="Optional description..." className={cn(inputClass,"resize-none")} />
              </Field>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Port"}
            </button>
          </div>
        </div></form>
      </div>
    </div>
  );
}
