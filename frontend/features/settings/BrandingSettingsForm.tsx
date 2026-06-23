"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type BrandingSettings } from "@/services/settings.service";
import { Save, Palette } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

function ColorInput({ label, name, register, watch }: { label: string; name: keyof BrandingSettings; register: any; watch: any }) {
  const value = watch(name) as string;
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border border-border flex-shrink-0"
          style={{ backgroundColor: value || "#000" }}
        />
        <input {...register(name)} className={inputClass} placeholder="#D4A63A" />
      </div>
    </div>
  );
}

export function BrandingSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-branding"],
    queryFn: () => settingsService.getBranding(),
  });

  const { register, handleSubmit, reset, watch } = useForm<BrandingSettings>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<BrandingSettings>) => settingsService.updateBranding(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-branding"] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Palette size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Platform Identity</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Platform Name</label>
            <input {...register("platform_name")} className={inputClass} placeholder="Naviora" />
          </div>
          <div>
            <label className={labelClass}>Platform Tagline</label>
            <input {...register("platform_tagline")} className={inputClass} placeholder="Enterprise Maritime Assessment Platform" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Palette size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Color Palette</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorInput label="Primary Color" name="primary_color" register={register} watch={watch} />
          <ColorInput label="Secondary Color" name="secondary_color" register={register} watch={watch} />
          <ColorInput label="Accent Color" name="accent_color" register={register} watch={watch} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Use hex color codes (e.g. #D4A63A). These values are consumed by white-label and organization branding modules.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Palette size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Asset Paths</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Login Background Path</label>
            <input {...register("login_background_path")} className={inputClass} placeholder="/assets/login-bg.jpg" />
          </div>
          <div>
            <label className={labelClass}>Email Header Logo Path</label>
            <input {...register("email_header_logo_path")} className={inputClass} placeholder="/assets/email-logo.png" />
          </div>
          <div>
            <label className={labelClass}>Report Logo Path</label>
            <input {...register("report_logo_path")} className={inputClass} placeholder="/assets/report-logo.png" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Provide server-relative paths to uploaded assets. Use the file manager to upload and retrieve paths.</p>
      </div>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Branding settings saved.</p>}
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
