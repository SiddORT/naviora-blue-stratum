"use client";

import { useEffect, useState } from "react";
import { CreditCard, Users, Monitor, ClipboardList, CheckCircle, Clock } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getOrgSubscription } from "@/services/org-portal.service";
import type { OrgSubscription } from "@/types/org-portal.types";

function UsageMeter({ label, used, max, icon: Icon, accent = "#D4A63A" }: {
  label: string; used: number; max: number; icon: React.ElementType; accent?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <span className="text-xs font-medium text-white">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-white">{used}</span>
        <span className="text-xs pb-1" style={{ color: "rgba(255,255,255,0.35)" }}>of {max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />
      </div>
      <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{pct}% used</p>
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active:   { bg: "rgba(34,197,94,0.1)",   color: "#22C55E" },
  Inactive: { bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
  Expired:  { bg: "rgba(239,68,68,0.1)",   color: "#EF4444" },
};

export function OrgSubscriptionView() {
  const { accessToken } = useOrgAuthStore();
  const [sub, setSub] = useState<OrgSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getOrgSubscription(accessToken)
      .then(setSub)
      .catch(() => setError("Failed to load subscription data"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading subscription...</div>
    </div>
  );

  if (error || !sub) return (
    <div className="rounded-xl p-8 text-center" style={{ background: "#141821", border: "1px solid rgba(239,68,68,0.2)" }}>
      <p className="text-sm text-red-400">{error ?? "No subscription data"}</p>
    </div>
  );

  const ss = STATUS_STYLES[sub.subscription_status] ?? STATUS_STYLES.Inactive;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Subscription</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your current plan and usage</p>
      </div>

      {/* Plan card */}
      <div className="rounded-xl p-6" style={{ background: "#141821", border: "1px solid rgba(212,166,58,0.2)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CreditCard className="w-5 h-5" style={{ color: "#D4A63A" }} />
              <h2 className="text-lg font-bold text-white">{sub.plan_name}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={ss}>
                {sub.subscription_status}
              </span>
            </div>
            <p className="text-sm ml-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              {sub.billing_cycle} billing
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">${sub.price_monthly.toFixed(0)}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>per month</p>
          </div>
        </div>

        <div className="mt-5 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
             style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Start Date",   value: sub.start_date ?? "—" },
            { label: "End Date",     value: sub.end_date ?? "No expiry" },
            { label: "Auto Renew",   value: sub.auto_renew ? "Yes" : "No" },
            { label: "Assessments",  value: `${sub.assessments_this_month} this month` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage meters */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Usage Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageMeter label="Users"      used={sub.current_users}      max={sub.max_users}      icon={Users}        accent="#2EA8FF" />
          <UsageMeter label="Simulators" used={sub.active_simulators}  max={sub.max_simulators} icon={Monitor}      accent="#A78BFA" />
          <UsageMeter label="Candidates" used={sub.current_candidates} max={sub.max_candidates ?? 0} icon={ClipboardList} accent="#D4A63A" />
        </div>
      </div>

      {/* Features */}
      <div className="rounded-xl p-5" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold text-white mb-4">Plan Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Assessment Engine", included: true },
            { label: "Candidate Management", included: true },
            { label: "Reporting & Analytics", included: true },
            { label: "Simulator Access", included: sub.max_simulators > 0 },
            { label: "AI Assessment Reports", included: false, soon: true },
            { label: "Certificate Generation", included: false, soon: true },
          ].map(({ label, included, soon }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-lg"
                 style={{ background: "rgba(255,255,255,0.02)" }}>
              {included ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
              ) : (
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: soon ? "#D4A63A" : "rgba(255,255,255,0.2)" }} />
              )}
              <span className="text-sm" style={{ color: included ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)" }}>
                {label} {soon && !included && <span className="text-[10px] ml-1" style={{ color: "#D4A63A" }}>Coming Soon</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
