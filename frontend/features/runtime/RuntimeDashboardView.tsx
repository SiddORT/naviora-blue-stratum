"use client";

import { useCallback, useEffect, useState } from "react";
import { runtimeService, type RuntimeStats } from "@/services/runtime.service";
import { Activity, Cpu, HardDrive, PlayCircle, Sliders, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  Pending: "#6B7280",
  Launching: "#2EA8FF",
  Running: "#22C55E",
  Completed: "#10B981",
  Failed: "#EF4444",
  Cancelled: "#F59E0B",
  "Timed Out": "#F97316",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ background: `${color}15`, borderRadius: 8, padding: 8 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#F9FAFB" }}>{value}</div>
    </div>
  );
}

export function RuntimeDashboardView() {
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await runtimeService.getDashboard();
      if (res.success) setStats(res.data!);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ color: "#6B7280", fontSize: 14 }}>Loading runtime data...</div>
      </div>
    );
  }

  if (!stats) return null;

  const { sessions, agents, configurations, vendors } = stats;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Total Sessions" value={sessions.total} icon={PlayCircle} color="#D4A63A" />
        <StatCard label="Active Today" value={sessions.today} icon={Activity} color="#2EA8FF" />
        <StatCard label="Agents Online" value={`${agents.online} / ${agents.total}`} icon={HardDrive} color="#22C55E" />
        <StatCard label="Runtime Configs" value={configurations.active} icon={Sliders} color="#8B5CF6" />
        <StatCard label="Vendors Active" value={vendors.active} icon={Cpu} color="#10B981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* By Status */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB", marginBottom: 16 }}>Sessions by Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(sessions.by_status).map(([status, count]) => (
              <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status] ?? "#6B7280" }} />
                  <span style={{ fontSize: 13, color: "#D1D5DB" }}>{status}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Mode */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB", marginBottom: 16 }}>Sessions by Runtime Mode</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(sessions.by_mode).map(([mode, count]) => (
              <div key={mode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: mode === "CLOUD_API" ? "#2EA8FF" : mode === "DESKTOP_OFFLINE" ? "#F59E0B" : "#8B5CF6" }} />
                  <span style={{ fontSize: 13, color: "#D1D5DB" }}>{mode}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Sessions */}
      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB" }}>Live Sessions</h3>
          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: "auto" }}>Auto-refreshes every 15s</span>
        </div>
        {sessions.active.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6B7280", fontSize: 13, padding: "32px 0" }}>No active sessions</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E2430" }}>
                  {["Reference", "Status", "Mode", "Started"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6B7280", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.active.map(s => (
                  <tr key={s.uuid} style={{ borderBottom: "1px solid #1E2430" }}>
                    <td style={{ padding: "10px 12px", color: "#D4A63A", fontFamily: "monospace" }}>{s.session_reference}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUS_COLOR[s.status] ?? "#6B7280"}20`, color: STATUS_COLOR[s.status] ?? "#6B7280" }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#9CA3AF" }}>{s.runtime_mode}</td>
                    <td style={{ padding: "10px 12px", color: "#9CA3AF" }}>
                      {s.started_at ? new Date(s.started_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
