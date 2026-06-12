"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";
import { toast } from "@/hooks/use-toast";
import { useUnsavedGuard } from "@/hooks/use-unsaved-guard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { SimulatorVendor } from "@/types/simulator.types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, underscores, hyphens only"),
  vendor_name: z.string().max(255).optional().or(z.literal("")),
  version: z.string().max(50).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  integration_type: z.enum(["REST_API", "WEBSOCKET", "FILE_IMPORT", "CUSTOM"]),
  base_url: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "deprecated"]),
});

type FormData = z.infer<typeof schema>;

const urlLabels: Record<string, string> = {
  REST_API:    "Simulator URL",
  WEBSOCKET:   "Simulator URL",
  FILE_IMPORT: "Simulator URL",
  CUSTOM:      "Simulator URL",
};

const urlPlaceholders: Record<string, string> = {
  REST_API:    "https://simulator.example.com/api/v1",
  WEBSOCKET:   "ws://simulator.example.com/ws",
  FILE_IMPORT: "sftp://files.example.com/exports",
  CUSTOM:      "https://",
};

function toAutoCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

interface Props {
  vendor?: SimulatorVendor;
}

export function VendorForm({ vendor }: Props) {
  const isEdit = !!vendor;
  const router = useRouter();
  const qc = useQueryClient();
  const codeManuallyEdited = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      integration_type: vendor?.integration_type ?? "REST_API",
      status: (vendor?.status as "active" | "inactive" | "deprecated") ?? "active",
      name: vendor?.name ?? "",
      code: vendor?.code ?? "",
      vendor_name: vendor?.vendor_name ?? "",
      version: vendor?.version ?? "",
      description: vendor?.description ?? "",
      base_url: vendor?.base_url ?? "",
    },
  });

  const { showModal, guardNavigation, confirmLeave, cancelLeave } = useUnsavedGuard(isDirty);

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name,
        code: vendor.code,
        vendor_name: vendor.vendor_name ?? "",
        version: vendor.version ?? "",
        description: vendor.description ?? "",
        base_url: vendor.base_url ?? "",
        integration_type: vendor.integration_type,
        status: vendor.status,
      });
      codeManuallyEdited.current = true;
    }
  }, [vendor, reset]);

  const nameValue = watch("name");
  const integrationType = watch("integration_type");

  useEffect(() => {
    if (!isEdit && !codeManuallyEdited.current) {
      const generated = toAutoCode(nameValue ?? "");
      setValue("code", generated, { shouldDirty: false });
    }
  }, [nameValue, isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        vendor_name: data.vendor_name || undefined,
        version: data.version || undefined,
        description: data.description || undefined,
        base_url: data.base_url || undefined,
      };
      return isEdit
        ? simulatorsService.updateVendor(vendor!.uuid, payload)
        : simulatorsService.createVendor(
            payload as Parameters<typeof simulatorsService.createVendor>[0]
          );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["simulator-vendors"] });
      toast({
        variant: "success",
        title: isEdit ? "Vendor updated" : "Vendor created",
        description: isEdit
          ? "Changes have been saved successfully."
          : "The simulator vendor has been added.",
      });
      router.push("/admin/simulator/vendors");
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err.message ?? "An unexpected error occurred.",
      });
    },
  });

  function handleBack() {
    guardNavigation(() => router.push("/admin/simulator/vendors"));
  }

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  function Field({
    label,
    required,
    error,
    hint,
    children,
  }: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {children}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={showModal}
        title="Unsaved Changes"
        message="You have unsaved changes. If you leave now, your changes will be lost."
        confirmLabel="Leave without saving"
        cancelLabel="Stay on page"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
        danger={false}
      />

      <div className="space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </button>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              {isEdit ? "Edit Simulator Vendor" : "Add Simulator Vendor"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update the vendor details. The vendor code cannot be changed."
                : "Register a new simulator vendor and its connection details."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="px-6 py-5 space-y-5"
          >
            {mutation.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {(mutation.error as Error)?.message ?? "An error occurred. Please try again."}
              </div>
            )}

            {/* Section: Identity */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identity
              </p>

              <Field label="Vendor Name" required error={errors.name?.message}>
                <input
                  {...register("name")}
                  placeholder="e.g. PASE Maritime Simulator"
                  className={inputClass}
                  autoFocus
                />
              </Field>

              <Field
                label="Vendor Code"
                required
                error={errors.code?.message}
                hint={
                  isEdit
                    ? "Code cannot be changed after creation."
                    : "Auto-generated from name. Edit to override."
                }
              >
                <div className="relative">
                  <input
                    {...register("code", {
                      onChange: () => {
                        codeManuallyEdited.current = true;
                      },
                    })}
                    placeholder="e.g. PASE"
                    disabled={isEdit}
                    className={cn(
                      inputClass,
                      "font-mono uppercase pr-10",
                      isEdit && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  {!isEdit && (
                    <button
                      type="button"
                      title="Re-generate from name"
                      onClick={() => {
                        codeManuallyEdited.current = false;
                        setValue("code", toAutoCode(nameValue ?? ""), {
                          shouldDirty: true,
                        });
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Vendor / Manufacturer" error={errors.vendor_name?.message}>
                  <input
                    {...register("vendor_name")}
                    placeholder="e.g. Blue Stratum Maritime"
                    className={inputClass}
                  />
                </Field>
                <Field label="Software Version" error={errors.version?.message}>
                  <input
                    {...register("version")}
                    placeholder="e.g. 4.2.1"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {/* Section: Integration */}
            <div className="space-y-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Integration
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Integration Type"
                  required
                  error={errors.integration_type?.message}
                >
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
              </div>

              <Field
                label={urlLabels[integrationType] ?? "Base URL"}
                error={errors.base_url?.message}
              >
                <input
                  {...register("base_url")}
                  placeholder={urlPlaceholders[integrationType] ?? "https://"}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Section: Details */}
            <div className="space-y-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </p>

              <Field label="Description" error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Brief description of this simulator vendor..."
                  className={cn(inputClass, "resize-none")}
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-5 py-2 text-sm font-semibold gradient-gold text-black rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {mutation.isPending
                  ? "Saving..."
                  : isEdit
                  ? "Save Changes"
                  : "Create Vendor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
