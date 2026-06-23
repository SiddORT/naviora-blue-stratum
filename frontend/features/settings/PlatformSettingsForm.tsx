"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type PlatformSettings } from "@/services/settings.service";
import { Save, Globe, MapPin, Palette } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "AUD", "JPY", "AED", "INR"];
const LANGUAGES = [{ code: "en", label: "English" }, { code: "ar", label: "Arabic" }, { code: "fr", label: "French" }, { code: "de", label: "German" }];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MMM-YYYY"];
const TIME_FORMATS = ["24h", "12h"];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export function PlatformSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-platform"],
    queryFn: () => settingsService.getPlatform(),
  });

  const { register, handleSubmit, reset } = useForm<PlatformSettings>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<PlatformSettings>) => settingsService.updatePlatform(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-platform"] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <Section title="Company Information" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name">
            <input {...register("company_name")} className={inputClass} placeholder="Blue Stratum" />
          </Field>
          <Field label="Legal Name">
            <input {...register("legal_name")} className={inputClass} placeholder="Blue Stratum Pte. Ltd." />
          </Field>
          <Field label="Company Email">
            <input {...register("company_email")} type="email" className={inputClass} placeholder="hello@company.com" />
          </Field>
          <Field label="Support Email">
            <input {...register("support_email")} type="email" className={inputClass} placeholder="support@company.com" />
          </Field>
          <Field label="Billing Email">
            <input {...register("billing_email")} type="email" className={inputClass} placeholder="billing@company.com" />
          </Field>
          <Field label="Company Phone">
            <input {...register("company_phone")} className={inputClass} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Website URL">
            <input {...register("website_url")} className={inputClass} placeholder="https://company.com" />
          </Field>
        </div>
      </Section>

      <Section title="Address" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Address Line 1">
            <input {...register("address_line_1")} className={inputClass} />
          </Field>
          <Field label="Address Line 2">
            <input {...register("address_line_2")} className={inputClass} />
          </Field>
          <Field label="City">
            <input {...register("city")} className={inputClass} />
          </Field>
          <Field label="State / Province">
            <input {...register("state")} className={inputClass} />
          </Field>
          <Field label="Country">
            <input {...register("country")} className={inputClass} />
          </Field>
          <Field label="Postal Code">
            <input {...register("postal_code")} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Locale & Format" icon={Palette}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Default Timezone">
            <select {...register("default_timezone")} className={inputClass}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
          <Field label="Default Currency">
            <select {...register("default_currency")} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Default Language">
            <select {...register("default_language")} className={inputClass}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Date Format">
            <select {...register("date_format")} className={inputClass}>
              {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Time Format">
            <select {...register("time_format")} className={inputClass}>
              {TIME_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Settings saved successfully.</p>}
        {mutation.isError && <p className="text-sm text-destructive">Failed to save settings. Please try again.</p>}
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
