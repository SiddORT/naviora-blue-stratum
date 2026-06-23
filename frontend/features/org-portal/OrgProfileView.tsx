"use client";

import { useEffect, useState } from "react";
import { Building2, Globe, Phone, Mail, MapPin, Clock, Shield, Calendar } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getOrgProfile } from "@/services/org-portal.service";

interface ProfileData {
  organization: {
    id: number; uuid: string; name: string; code: string;
    email: string | null; phone: string | null; website: string | null;
    address_line1: string | null; address_line2: string | null;
    city: string | null; state: string | null; country: string | null;
    pincode: string | null; timezone: string | null; runtime_mode: string | null;
    organization_type: string | null; logo_url: string | null;
    subscription_status: string; max_users: number; is_active: boolean;
    created_at: string | null; updated_at: string | null;
  };
  subscription: {
    plan_name: string; plan_slug: string; subscription_status: string;
    billing_cycle: string; start_date: string | null; end_date: string | null;
  } | null;
  activity: { action: string; resource_type: string; created_at: string | null }[];
}

function InfoRow({ icon: Icon, label, value, accent = "#D4A63A" }: {
  icon: React.ElementType; label: string; value: string | null | undefined; accent?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3"
         style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
      <div className="min-w-0">
        <p className="text-[11px] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}

const ACTION_COLORS: Record<string, string> = {
  "org.settings.updated": "#D4A63A",
  "org.user.created":     "#2EA8FF",
  "org.candidate.created": "#22C55E",
  "org_user.login":       "#A78BFA",
};

export function OrgProfileView() {
  const { accessToken } = useOrgAuthStore();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getOrgProfile(accessToken)
      .then(setData)
      .catch(() => setError("Failed to load organization profile"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading profile...</div>
    </div>
  );

  if (error || !data) return (
    <div className="rounded-xl p-8 text-center" style={{ background: "#141821", border: "1px solid rgba(239,68,68,0.2)" }}>
      <p className="text-sm text-red-400">{error ?? "No data available"}</p>
    </div>
  );

  const { organization: org, subscription, activity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Organization Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Organization information and activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — org info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="rounded-xl p-6" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-4 mb-5">
              {org.logo_url ? (
                <img src={org.logo_url} alt="Logo"
                     className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                     style={{ border: "1px solid rgba(212,166,58,0.2)" }} />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)" }}>
                  <Building2 className="w-7 h-7 text-black" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{org.name}</h2>
                <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{org.code}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: org.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: org.is_active ? "#22C55E" : "#EF4444",
                        }}>
                    {org.is_active ? "Active" : "Inactive"}
                  </span>
                  {org.subscription_status && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: "rgba(212,166,58,0.08)", color: "#D4A63A", border: "1px solid rgba(212,166,58,0.15)" }}>
                      {org.subscription_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-0">
              <InfoRow icon={Mail}    label="Email"       value={org.email} />
              <InfoRow icon={Phone}   label="Phone"       value={org.phone} />
              <InfoRow icon={Globe}   label="Website"     value={org.website} />
              <InfoRow icon={MapPin}  label="Location"    value={[org.city, org.state, org.country].filter(Boolean).join(", ")} />
              <InfoRow icon={Clock}   label="Timezone"    value={org.timezone} />
              <InfoRow icon={Shield}  label="Runtime"     value={org.runtime_mode} />
              <InfoRow icon={Calendar} label="Member Since" value={org.created_at ? new Date(org.created_at).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Subscription info */}
          {subscription && (
            <div className="rounded-xl p-5" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Subscription Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Plan",    value: subscription.plan_name },
                  { label: "Billing", value: subscription.billing_cycle },
                  { label: "Status",  value: subscription.subscription_status },
                  { label: "Start",   value: subscription.start_date ?? "—" },
                  { label: "Expiry",  value: subscription.end_date ?? "No expiry" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                    <p className="text-sm font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — activity */}
        <div className="rounded-xl p-5" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => {
                const accent = ACTION_COLORS[a.action] ?? "#6B7280";
                const label = a.action.split(".").slice(1).join(" ").replace(/_/g, " ");
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: accent }} />
                    <div className="min-w-0">
                      <p className="text-xs text-white capitalize">{label}</p>
                      {a.created_at && (
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
