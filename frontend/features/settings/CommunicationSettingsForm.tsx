"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type CommunicationSettings } from "@/services/settings.service";
import { Save, Mail, Wifi, Send, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

type FormValues = CommunicationSettings & { smtp_password?: string };

export function CommunicationSettingsForm() {
  const qc = useQueryClient();
  const [showPwd, setShowPwd] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["settings-communication"],
    queryFn: () => settingsService.getCommunication(),
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (data?.data) reset({ ...data.data, smtp_password: "" });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Record<string, unknown> = { ...values };
      if (!payload.smtp_password) delete payload.smtp_password;
      return settingsService.updateCommunication(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-communication"] }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => settingsService.verifySmtp(),
    onSuccess: (res) => {
      setVerifyResult({ ok: true, msg: res.message || "Connection verified" });
      qc.invalidateQueries({ queryKey: ["settings-communication"] });
    },
    onError: () => setVerifyResult({ ok: false, msg: "Connection failed. Check SMTP settings." }),
  });

  const testMutation = useMutation({
    mutationFn: () => settingsService.sendTestEmail(testEmail),
    onSuccess: (res) => setTestResult({ ok: true, msg: res.message || "Test email sent" }),
    onError: () => setTestResult({ ok: false, msg: "Failed to send test email." }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  const isVerified = data?.data?.is_verified;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Mail size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">SMTP Configuration</h3>
          {isVerified ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle size={12} /> Verified
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
              <XCircle size={12} /> Not Verified
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>SMTP Host</label>
            <input {...register("smtp_host")} className={inputClass} placeholder="smtp.sendgrid.net" />
          </div>
          <div>
            <label className={labelClass}>SMTP Port</label>
            <input {...register("smtp_port", { valueAsNumber: true })} type="number" className={inputClass} placeholder="587" />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input {...register("smtp_username")} className={inputClass} placeholder="apikey" />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                {...register("smtp_password")}
                type={showPwd ? "text" : "password"}
                className={`${inputClass} pr-10`}
                placeholder={data?.data?.smtp_password_set ? "•••••••• (leave blank to keep current)" : "Enter SMTP password"}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Encrypted at rest. Leave blank to keep the current password.</p>
          </div>
          <div>
            <label className={labelClass}>Encryption</label>
            <select {...register("smtp_encryption")} className={inputClass}>
              <option value="TLS">TLS (Recommended)</option>
              <option value="SSL">SSL</option>
              <option value="NONE">None</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Mail size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Sender Identity</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sender Name</label>
            <input {...register("sender_name")} className={inputClass} placeholder="Naviora" />
          </div>
          <div>
            <label className={labelClass}>Sender Email</label>
            <input {...register("sender_email")} type="email" className={inputClass} placeholder="noreply@naviora.com" />
          </div>
          <div>
            <label className={labelClass}>Reply-To Email</label>
            <input {...register("reply_to_email")} type="email" className={inputClass} placeholder="support@naviora.com" />
          </div>
          <div>
            <label className={labelClass}>Test Email Address</label>
            <input {...register("test_email_address")} type="email" className={inputClass} placeholder="test@company.com" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Wifi size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Connection & Test</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className={labelClass}>Send Test Email To</label>
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              type="email"
              className={inputClass}
              placeholder="recipient@example.com"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => { setVerifyResult(null); verifyMutation.mutate(); }}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Wifi size={14} />
              {verifyMutation.isPending ? "Verifying..." : "Verify Connection"}
            </button>
            <button
              type="button"
              disabled={testMutation.isPending || !testEmail}
              onClick={() => { setTestResult(null); testMutation.mutate(); }}
              className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Send size={14} />
              {testMutation.isPending ? "Sending..." : "Send Test Email"}
            </button>
          </div>
        </div>
        {verifyResult && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${verifyResult.ok ? "text-emerald-400" : "text-destructive"}`}>
            {verifyResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {verifyResult.msg}
          </div>
        )}
        {testResult && (
          <div className={`mt-2 flex items-center gap-2 text-sm ${testResult.ok ? "text-emerald-400" : "text-destructive"}`}>
            {testResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {testResult.msg}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Communication settings saved.</p>}
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
