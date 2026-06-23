"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type NotificationSettings } from "@/services/settings.service";
import { Save, Bell } from "lucide-react";

const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";
const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-4 border-b border-border last:border-0 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {disabled && <span className="text-xs text-amber-400 mt-1 block">Coming soon</span>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-primary" : "bg-muted"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-notifications"],
    queryFn: () => settingsService.getNotifications(),
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<NotificationSettings>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<NotificationSettings>) => settingsService.updateNotifications(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-notifications"] }),
  });

  const values = watch();

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Bell size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Active Channels</h3>
        </div>
        <ToggleRow
          label="Email Notifications"
          description="Send transactional emails to users (invitations, password resets, assessment notifications)"
          checked={!!values.enable_email_notifications}
          onChange={(v) => setValue("enable_email_notifications", v)}
        />
        <ToggleRow
          label="System Notifications"
          description="Show in-app notifications for platform events and alerts"
          checked={!!values.enable_system_notifications}
          onChange={(v) => setValue("enable_system_notifications", v)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Bell size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Future Channels</h3>
          <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Coming Soon</span>
        </div>
        <ToggleRow
          label="SMS Notifications"
          description="Send SMS alerts via Twilio or similar provider"
          checked={!!values.enable_sms_notifications}
          onChange={(v) => setValue("enable_sms_notifications", v)}
          disabled
        />
        <ToggleRow
          label="WhatsApp Notifications"
          description="Send WhatsApp messages via approved business account"
          checked={!!values.enable_whatsapp_notifications}
          onChange={(v) => setValue("enable_whatsapp_notifications", v)}
          disabled
        />
        <ToggleRow
          label="Microsoft Teams"
          description="Post notifications to Teams channels via webhook"
          checked={!!values.enable_teams_notifications}
          onChange={(v) => setValue("enable_teams_notifications", v)}
          disabled
        />
        <ToggleRow
          label="Slack"
          description="Post notifications to Slack channels via webhook"
          checked={!!values.enable_slack_notifications}
          onChange={(v) => setValue("enable_slack_notifications", v)}
          disabled
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Bell size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Webhook URLs</h3>
          <span className="ml-auto text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Future Use</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Teams Webhook URL</label>
            <input {...register("teams_webhook_url")} className={inputClass} placeholder="https://outlook.office.com/webhook/..." disabled />
          </div>
          <div>
            <label className={labelClass}>Slack Webhook URL</label>
            <input {...register("slack_webhook_url")} className={inputClass} placeholder="https://hooks.slack.com/services/..." disabled />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Notification settings saved.</p>}
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
