"use client";

import { useEffect, useState } from "react";
import { Save, Globe, Bell, Shield, Building2 } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getOrgSettings, updateOrgSettings } from "@/services/org-portal.service";
import type { OrgProfile, OrgSettingsUpdate } from "@/types/org-portal.types";

const TABS = [
  { id: "general",       label: "General",       icon: Building2 },
  { id: "branding",      label: "Branding",      icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security",      label: "Security",      icon: Shield },
];

const TIMEZONES = [
  "UTC", "UTC+1", "UTC+2", "UTC+3", "UTC+4", "UTC+5", "UTC+5:30",
  "UTC+6", "UTC+7", "UTC+8", "UTC+9", "UTC+10", "UTC+12",
  "UTC-5", "UTC-6", "UTC-7", "UTC-8",
];

export function OrgSettingsView() {
  const { accessToken, user: me } = useOrgAuthStore();
  const [tab, setTab] = useState("general");
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OrgSettingsUpdate>({});

  const isAdmin = me?.user_type === "ORG_ADMIN";

  useEffect(() => {
    if (!accessToken) return;
    getOrgSettings(accessToken)
      .then(data => {
        setOrg(data);
        setForm({
          name: data.name,
          email: data.email ?? "",
          phone: data.phone ?? "",
          website: data.website ?? "",
          address_line1: data.address_line1 ?? "",
          address_line2: data.address_line2 ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          pincode: data.pincode ?? "",
          timezone: data.timezone ?? "UTC",
        });
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleSave = async () => {
    if (!accessToken || !isAdmin) return;
    setSaving(true);
    setError(null);
    try {
      await updateOrgSettings(accessToken, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof OrgSettingsUpdate, type = "text", placeholder = "") => (
    <div key={key}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
      <input type={type} placeholder={placeholder}
             value={(form[key] as string) ?? ""}
             onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
             disabled={!isAdmin}
             className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
             style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading settings...</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your organization settings</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: saved ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #D4A63A, #B8860B)", color: saved ? "#22C55E" : "#000", border: saved ? "1px solid rgba(34,197,94,0.3)" : "none" }}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-400"
             style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
           style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={tab === id
                    ? { background: "linear-gradient(135deg, #D4A63A, #B8860B)", color: "#000" }
                    : { color: "rgba(255,255,255,0.45)" }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl p-6" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        {tab === "general" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-white">General Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Organization Name", "name", "text", "My Organization")}
              {field("Contact Email", "email", "email", "contact@org.com")}
              {field("Phone", "phone", "text", "+1 555 0000")}
              {field("Website", "website", "url", "https://org.com")}
              {field("Address Line 1", "address_line1", "text", "123 Main St")}
              {field("Address Line 2", "address_line2", "text", "Suite 100")}
              {field("City", "city", "text", "Manila")}
              {field("State / Province", "state", "text", "Metro Manila")}
              {field("Country", "country", "text", "Philippines")}
              {field("Postal Code", "pincode", "text", "1000")}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Timezone</label>
              <select value={form.timezone ?? "UTC"}
                      onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                      disabled={!isAdmin}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "branding" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-white">Branding</h2>
            {field("Display Name", "name", "text", "My Organization")}
            {field("Logo URL", "logo_url", "url", "https://...")}
            {org?.logo_url && (
              <div>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Current Logo</p>
                <img src={org.logo_url} alt="Logo" className="h-12 object-contain rounded" />
              </div>
            )}
            <div className="rounded-lg px-4 py-3"
                 style={{ background: "rgba(212,166,58,0.06)", border: "1px solid rgba(212,166,58,0.12)" }}>
              <p className="text-xs" style={{ color: "rgba(212,166,58,0.6)" }}>
                File upload coming soon. For now, provide a publicly accessible URL.
              </p>
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Notification Emails</h2>
            {field("Notification Email", "email", "email", "notifications@org.com")}
            <div className="rounded-lg px-4 py-3"
                 style={{ background: "rgba(212,166,58,0.06)", border: "1px solid rgba(212,166,58,0.12)" }}>
              <p className="text-xs" style={{ color: "rgba(212,166,58,0.6)" }}>
                Granular notification controls will be available in a future update.
              </p>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Security</h2>
            <div className="rounded-xl p-8 text-center"
                 style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Password policy and security settings coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
