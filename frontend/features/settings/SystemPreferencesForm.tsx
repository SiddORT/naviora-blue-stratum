"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type SystemPreferences } from "@/services/settings.service";
import { Save, SlidersHorizontal, Shield, Globe } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "AUD", "JPY", "AED", "INR"];
const LANGUAGES = [{ code: "en", label: "English" }, { code: "ar", label: "Arabic" }, { code: "fr", label: "French" }, { code: "de", label: "German" }];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <Icon size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SystemPreferencesForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-system"],
    queryFn: () => settingsService.getSystem(),
  });

  const { register, handleSubmit, reset } = useForm<SystemPreferences>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<SystemPreferences>) => settingsService.updateSystem(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-system"] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <Section title="Global Defaults" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Default Timezone</label>
            <select {...register("default_timezone")} className={inputClass}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Default Currency</label>
            <select {...register("default_currency")} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Default Language</label>
            <select {...register("default_language")} className={inputClass}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Session & Security Policy" icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Session Timeout (minutes)</label>
            <input {...register("session_timeout_minutes", { valueAsNumber: true })} type="number" min={5} max={1440} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Users will be logged out after this period of inactivity. Range: 5–1440 min.</p>
          </div>
          <div>
            <label className={labelClass}>Password Expiry (days)</label>
            <input {...register("password_expiry_days", { valueAsNumber: true })} type="number" min={0} max={365} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Set to 0 to disable password expiry.</p>
          </div>
          <div>
            <label className={labelClass}>Max Login Attempts</label>
            <input {...register("max_login_attempts", { valueAsNumber: true })} type="number" min={1} max={20} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Account is locked after this many consecutive failed logins.</p>
          </div>
          <div>
            <label className={labelClass}>Lockout Duration (minutes)</label>
            <input {...register("lockout_duration_minutes", { valueAsNumber: true })} type="number" min={1} max={1440} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">How long an account remains locked before auto-unlock.</p>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">System preferences saved.</p>}
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
