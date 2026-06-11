"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { simulatorsService } from "@/services/simulators.service";
import type { SimulatorConfiguration } from "@/types/simulator.types";

const schema = z.object({
  simulator_vendor_id: z.number({ required_error: "Simulator vendor is required" }).int().positive(),
  configuration_name: z.string().min(2, "Name required").max(255),
  base_url: z.string().max(500).optional().or(z.literal("")),
  authentication_type: z.enum(["API_KEY", "BEARER", "BASIC", "NONE"]),
  api_key: z.string().max(500).optional().or(z.literal("")),
  client_id: z.string().max(255).optional().or(z.literal("")),
  client_secret: z.string().max(500).optional().or(z.literal("")),
  webhook_url: z.string().max(500).optional().or(z.literal("")),
  connection_timeout: z.number().int().min(1).max(300),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  config: SimulatorConfiguration | null;
  onSuccess: () => void;
}

const inputClass =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
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

export function ConfigurationFormDrawer({ open, onClose, config, onSuccess }: Props) {
  const isEdit = !!config;

  const { data: vendorsData } = useQuery({
    queryKey: ["simulator-vendors-all"],
    queryFn: () => simulatorsService.listVendors({ page: 1, page_size: 100, status: "active" }),
    enabled: open,
  });
  const vendors = vendorsData?.data?.items ?? [];

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { authentication_type: "NONE", connection_timeout: 30, status: "active" },
  });

  const authType = watch("authentication_type");

  useEffect(() => {
    if (config) {
      reset({
        simulator_vendor_id: config.simulator_vendor_id,
        configuration_name: config.configuration_name,
        base_url: config.base_url ?? "",
        authentication_type: config.authentication_type as FormData["authentication_type"],
        webhook_url: config.webhook_url ?? "",
        connection_timeout: config.connection_timeout,
        status: config.status as "active" | "inactive",
      });
    } else {
      reset({ authentication_type: "NONE", connection_timeout: 30, status: "active" });
    }
  }, [config, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        base_url: data.base_url || undefined,
        api_key: data.api_key || undefined,
        client_id: data.client_id || undefined,
        client_secret: data.client_secret || undefined,
        webhook_url: data.webhook_url || undefined,
      };
      return isEdit
        ? simulatorsService.updateConfiguration(config!.uuid, payload)
        : simulatorsService.createConfiguration(payload as Parameters<typeof simulatorsService.createConfiguration>[0]);
    },
    onSuccess: () => { onSuccess(); onClose(); },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit Configuration" : "Add Configuration"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {mutation.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {(mutation.error as Error)?.message ?? "An error occurred"}
            </div>
          )}

          <Field label="Simulator Vendor" required error={errors.simulator_vendor_id?.message}>
            <select
              {...register("simulator_vendor_id", { valueAsNumber: true })}
              className={inputClass}
            >
              <option value="">Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.uuid} value={v.id}>{v.name} ({v.code})</option>
              ))}
            </select>
          </Field>

          <Field label="Configuration Name" required error={errors.configuration_name?.message}>
            <input {...register("configuration_name")} placeholder="e.g. Production PASE Instance" className={inputClass} />
          </Field>

          <Field label="Base URL" error={errors.base_url?.message}>
            <input {...register("base_url")} placeholder="https://simulator.example.com/api" className={inputClass} />
          </Field>

          <Field label="Authentication Type" required error={errors.authentication_type?.message}>
            <select {...register("authentication_type")} className={inputClass}>
              <option value="NONE">None</option>
              <option value="API_KEY">API Key</option>
              <option value="BEARER">Bearer Token</option>
              <option value="BASIC">Basic Auth</option>
            </select>
          </Field>

          {authType === "API_KEY" && (
            <Field label="API Key" error={errors.api_key?.message}>
              <input {...register("api_key")} type="password" placeholder="Enter API key" className={inputClass} />
            </Field>
          )}

          {(authType === "BEARER" || authType === "BASIC") && (
            <>
              <Field label="Client ID" error={errors.client_id?.message}>
                <input {...register("client_id")} placeholder="Client ID" className={inputClass} />
              </Field>
              <Field label="Client Secret" error={errors.client_secret?.message}>
                <input {...register("client_secret")} type="password" placeholder="Client secret" className={inputClass} />
              </Field>
            </>
          )}

          <Field label="Webhook URL" error={errors.webhook_url?.message}>
            <input {...register("webhook_url")} placeholder="https://naviora.app/webhooks/simulator" className={inputClass} />
          </Field>

          <Field label="Connection Timeout (seconds)" required error={errors.connection_timeout?.message}>
            <input {...register("connection_timeout", { valueAsNumber: true })} type="number" min={1} max={300} className={inputClass} />
          </Field>

          <Field label="Status" required error={errors.status?.message}>
            <select {...register("status")} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </form>

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
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
