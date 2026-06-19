"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { vesselService } from "@/services/master-data.service";
import { toast } from "@/hooks/use-toast";
import type { Vessel } from "@/types/master-data.types";

const VESSEL_TYPES = [
  "Container Vessel","Bulk Carrier","Oil Tanker","Chemical Tanker","LNG Carrier",
  "Ferry","Tug","Fishing Vessel","Naval Vessel","Offshore Vessel","Custom",
];
const MANEUVERING = ["Excellent","Good","Fair","Poor"];

const schema = z.object({
  vessel_name: z.string().min(2,"Name must be at least 2 characters").max(255),
  vessel_code: z.string().min(2,"Code required").max(50),
  vessel_type: z.string().min(1,"Vessel type required"),
  imo_category: z.string().max(100).optional().or(z.literal("")),
  length: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  beam:   z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  draft:  z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  max_speed: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).nullable().optional()),
  maneuverability_rating: z.string().optional().or(z.literal("")),
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

function toCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g,"").replace(/\s+/g,"_").replace(/^_+|_+$/g,"").slice(0,50);
}

interface Props { open: boolean; onClose: () => void; item: Vessel | null; onSuccess: () => void; }

export function VesselFormDrawer({ open, onClose, item, onSuccess }: Props) {
  const isEdit = !!item;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vessel_type: "Container Vessel", status: "active" },
  });

  useEffect(() => {
    if (open) {
      codeManual.current = false;
      reset(item ? {
        vessel_name: item.vessel_name, vessel_code: item.vessel_code,
        vessel_type: item.vessel_type, imo_category: item.imo_category ?? "",
        length: item.length ?? undefined, beam: item.beam ?? undefined,
        draft: item.draft ?? undefined, max_speed: item.max_speed ?? undefined,
        maneuverability_rating: item.maneuverability_rating ?? "",
        description: item.description ?? "", status: item.status as "active"|"inactive",
      } : { vessel_type: "Container Vessel", status: "active" });
    }
  }, [open, item, reset]);

  const vesselName = watch("vessel_code");
  const nameVal = watch("vessel_name");
  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("vessel_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit
      ? vesselService.update(item!.uuid, data)
      : vesselService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master-data-vessels"] });
      toast({ variant: "success", title: isEdit ? "Vessel updated" : "Vessel created" });
      onSuccess();
      onClose();
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
          <h2 className="text-base font-semibold text-foreground">{isEdit ? "Edit Vessel" : "Add Vessel"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex-1 overflow-y-auto"><div className="max-w-5xl mx-auto px-10 py-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Vessel Name" required error={errors.vessel_name?.message}>
                <input {...register("vessel_name")} placeholder="e.g. Container Vessel Alpha" className={inputClass} />
              </Field>
            </div>
            <Field label="Vessel Code" required error={errors.vessel_code?.message}>
              <input {...register("vessel_code")} placeholder="e.g. CVA-001" className={inputClass}
                onChange={e => { codeManual.current = true; setValue("vessel_code", e.target.value.toUpperCase()); }} />
            </Field>
            <Field label="Vessel Type" required error={errors.vessel_type?.message}>
              <select {...register("vessel_type")} className={inputClass}>
                {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="IMO Category" error={errors.imo_category?.message}>
                <input {...register("imo_category")} placeholder="e.g. Class I" className={inputClass} />
              </Field>
            </div>
            <Field label="Length (m)" error={errors.length?.message}>
              <input {...register("length")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Beam (m)" error={errors.beam?.message}>
              <input {...register("beam")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Draft (m)" error={errors.draft?.message}>
              <input {...register("draft")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Max Speed (kn)" error={errors.max_speed?.message}>
              <input {...register("max_speed")} type="number" step="0.01" placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Maneuverability" error={errors.maneuverability_rating?.message}>
              <select {...register("maneuverability_rating")} className={inputClass}>
                <option value="">— Select —</option>
                {MANEUVERING.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Description" error={errors.description?.message}>
                <textarea {...register("description")} rows={3} placeholder="Optional description..." className={cn(inputClass, "resize-none")} />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md gradient-gold text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Vessel"}
            </button>
          </div>
        </div></form>
      </div>
    </div>
  );
}
