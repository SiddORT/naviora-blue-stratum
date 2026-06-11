"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { simulatorsService } from "@/services/simulators.service";
import type { SimulatorVendor } from "@/types/simulator.types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  code: z.string().min(2, "Code must be at least 2 characters").max(50).regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with hyphens/underscores only"),
  vendor_name: z.string().max(255).optional().or(z.literal("")),
  version: z.string().max(50).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  integration_type: z.enum(["REST_API", "WEBSOCKET", "FILE_IMPORT", "CUSTOM"]),
  status: z.enum(["active", "inactive", "deprecated"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  vendor: SimulatorVendor | null;
  onSuccess: () => void;
}

export function VendorFormDrawer({ open, onClose, vendor, onSuccess }: Props) {
  const isEdit = !!vendor;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      integration_type: "REST_API",
      status: "active",
    },
  });

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name,
        code: vendor.code,
        vendor_name: vendor.vendor_name ?? "",
        version: vendor.version ?? "",
        description: vendor.description ?? "",
        integration_type: vendor.integration_type,
        status: vendor.status,
      });
    } else {
      reset({ integration_type: "REST_API", status: "active" });
    }
  }, [vendor, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        vendor_name: data.vendor_name || undefined,
        version: data.version || undefined,
        description: data.description || undefined,
      };
      return isEdit
        ? simulatorsService.updateVendor(vendor!.uuid, payload)
        : simulatorsService.createVendor(payload as Parameters<typeof simulatorsService.createVendor>[0]);
    },
    onSuccess: () => { onSuccess(); onClose(); },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit Simulator Vendor" : "Add Simulator Vendor"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {mutation.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {(mutation.error as Error)?.message ?? "An error occurred"}
            </div>
          )}

          <Field label="Name" required error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. PASE Simulator" className={inputClass} />
          </Field>

          <Field label="Code" required error={errors.code?.message} hint="Uppercase alphanumeric. Cannot be changed after creation.">
            <input {...register("code")} placeholder="e.g. PASE" disabled={isEdit}
              className={cn(inputClass, isEdit && "opacity-50 cursor-not-allowed")} />
          </Field>

          <Field label="Vendor Name" error={errors.vendor_name?.message}>
            <input {...register("vendor_name")} placeholder="e.g. Blue Stratum Maritime" className={inputClass} />
          </Field>

          <Field label="Version" error={errors.version?.message}>
            <input {...register("version")} placeholder="e.g. 4.2.1" className={inputClass} />
          </Field>

          <Field label="Integration Type" required error={errors.integration_type?.message}>
            <select {...register("integration_type")} className={inputClass}>
              <option value="REST_API">REST API</option>
              <option value="WEBSOCKET">WebSocket</option>
              <option value="FILE_IMPORT">File Import</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </Field>

          <Field label="Status" required error={errors.status?.message}>
            <select {...register("status")} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} rows={3} placeholder="Brief description of this simulator vendor..."
              className={cn(inputClass, "resize-none")} />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-semibold gradient-gold text-black rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const inputClass =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
