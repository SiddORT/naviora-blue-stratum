"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type PortalSettings } from "@/services/settings.service";
import { Save, ExternalLink, Globe } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

export function PortalSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-portal"],
    queryFn: () => settingsService.getPortal(),
  });

  const { register, handleSubmit, reset, watch } = useForm<PortalSettings>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<PortalSettings>) => settingsService.updatePortal(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-portal"] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  const urls = watch();

  const portals = [
    { key: "public_url" as const, label: "Public URL", desc: "Marketing / public landing page", icon: "🌐" },
    { key: "admin_url" as const, label: "Admin Portal URL", desc: "Super admin and staff login", icon: "🔐" },
    { key: "organization_url" as const, label: "Organization Portal URL", desc: "Organization admin login", icon: "🏢" },
    { key: "candidate_url" as const, label: "Candidate Portal URL", desc: "Candidate assessment access", icon: "👤" },
  ];

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <ExternalLink size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Portal URLs</h3>
        </div>
        <div className="space-y-5">
          {portals.map(({ key, label, desc }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input {...register(key)} className={inputClass} />
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Globe size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Custom Domain</h3>
          <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Coming Soon</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Custom Domain</label>
            <input {...register("custom_domain")} className={inputClass} placeholder="app.yourcompany.com" disabled />
            <p className="text-xs text-muted-foreground mt-1">Custom domain support with automatic TLS will be available in a future release.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <ExternalLink size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Current Configuration</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {portals.map(({ key, label }) => (
            <div key={key} className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-mono text-primary truncate">{urls[key] || "/"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Portal settings saved.</p>}
        {mutation.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
        {!mutation.isSuccess && !mutation.isError && <span />}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
