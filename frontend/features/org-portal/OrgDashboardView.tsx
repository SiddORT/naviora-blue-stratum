"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, ClipboardList, CheckCircle, TrendingUp, CreditCard, BarChart3, Clock } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getOrgDashboard } from "@/services/org-portal.service";
import type { OrgDashboardStats } from "@/types/org-portal.types";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}

function StatCard({ label, value, sub, icon: Icon, accent = "#D4A63A" }: StatCardProps) {
  return (
    <div className="rounded-xl p-5 flex items-start gap-4"
         style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
           style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>}
      </div>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  used: number;
  max: number;
  accent?: string;
}

function UsageBar({ label, used, max, accent = "#D4A63A" }: UsageBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span className="text-xs font-medium" style={{ color: accent }}>{used} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}AA)` }} />
      </div>
      <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{pct}% used</p>
    </div>
  );
}

export function OrgDashboardView() {
  const { accessToken, user } = useOrgAuthStore();
  const [stats, setStats] = useState<OrgDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getOrgDashboard(accessToken)
      .then(setStats)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#141821", border: "1px solid rgba(239,68,68,0.2)" }}>
        <p className="text-sm text-red-400">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Welcome back, {user?.full_name ?? "Admin"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={stats.total_users}           icon={Users}        accent="#2EA8FF" />
        <StatCard label="Total Candidates"  value={stats.total_candidates}      icon={GraduationCap} accent="#D4A63A" />
        <StatCard label="Active Assessments" value={stats.active_assessments}   icon={ClipboardList}  accent="#22C55E" />
        <StatCard label="Completed"         value={stats.completed_assessments} icon={CheckCircle}    accent="#A78BFA" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription summary */}
        <div className="rounded-xl p-5" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4" style={{ color: "#D4A63A" }} />
            <h2 className="text-sm font-semibold text-white">Subscription</h2>
          </div>
          <div className="space-y-1 mb-5">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Current Plan</span>
              <span className="text-xs font-semibold" style={{ color: "#D4A63A" }}>
                {stats.current_plan ?? "No active plan"}
              </span>
            </div>
            {stats.plan_renewal_date && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Renewal Date</span>
                <span className="text-xs text-white">{stats.plan_renewal_date}</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <UsageBar label="Users"      used={stats.users_used}      max={stats.max_users}      accent="#2EA8FF" />
            <UsageBar label="Candidates" used={stats.candidates_used} max={stats.max_candidates} accent="#D4A63A" />
          </div>
        </div>

        {/* Performance */}
        <div className="rounded-xl p-5" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#22C55E" }} />
            <h2 className="text-sm font-semibold text-white">Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: "#22C55E" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Pass Rate</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.pass_rate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" style={{ color: "#A78BFA" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Completed Assessments</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.completed_assessments}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#2EA8FF" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Active Now</span>
              </div>
              <span className="text-sm font-bold text-white">{stats.active_assessments}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 rounded-lg px-3 py-2"
               style={{ background: "rgba(212,166,58,0.06)", border: "1px solid rgba(212,166,58,0.12)" }}>
            <p className="text-[11px]" style={{ color: "rgba(212,166,58,0.7)" }}>
              Simulator sessions and AI reports coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
