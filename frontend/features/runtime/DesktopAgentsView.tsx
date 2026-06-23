"use client";

import { useCallback, useEffect, useState } from "react";
import { runtimeService, type DesktopAgent } from "@/services/runtime.service";
import { RefreshCw, Trash2, HardDrive, Wifi, WifiOff } from "lucide-react";

const STATUS_COLOR: Record<string, string> = { Online: "#22C55E", Offline: "#6B7280", Disabled: "#EF4444" };

export function DesktopAgentsView() {
  const [agents, setAgents] = useState<DesktopAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runtimeService.listAgents({ page: 1, page_size: 100 });
      if (res.success) { setAgents(res.data!.items); setTotal(res.data!.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const handleStatusChange = async (uuid: string, newStatus: string) => {
    await runtimeService.updateAgentStatus(uuid, newStatus);
    load();
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Remove this agent?")) return;
    await runtimeService.deleteAgent(uuid);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          {total} agent{total !== 1 ? "s" : ""} registered
          <span style={{ marginLeft: 12, color: "#22C55E" }}>{agents.filter(a => a.status === "Online").length} online</span>
        </div>
        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #1E2430", background: "#141821", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", fontSize: 13, padding: 40, textAlign: "center" }}>Loading...</div>
      ) : agents.length === 0 ? (
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, padding: 60, textAlign: "center" }}>
          <HardDrive size={40} style={{ color: "#374151", margin: "0 auto 12px" }} />
          <div style={{ color: "#6B7280", fontSize: 14 }}>No desktop agents registered</div>
          <div style={{ color: "#4B5563", fontSize: 12, marginTop: 4 }}>Agents register automatically when the Desktop Agent client connects</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {agents.map(a => (
            <div key={a.uuid} style={{ background: "#141821", border: `1px solid ${a.status === "Online" ? "#22C55E40" : "#1E2430"}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: `${STATUS_COLOR[a.status] ?? "#6B7280"}20`, borderRadius: 8, padding: 8 }}>
                    {a.status === "Online" ? <Wifi size={16} style={{ color: "#22C55E" }} /> : <WifiOff size={16} style={{ color: "#6B7280" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB" }}>{a.agent_name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{a.machine_name}</div>
                  </div>
                </div>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUS_COLOR[a.status] ?? "#6B7280"}20`, color: STATUS_COLOR[a.status] ?? "#6B7280" }}>
                  {a.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 14 }}>
                <div><span style={{ color: "#6B7280" }}>IP: </span><span style={{ color: "#D1D5DB" }}>{a.ip_address ?? "—"}</span></div>
                <div><span style={{ color: "#6B7280" }}>Version: </span><span style={{ color: "#D1D5DB" }}>{a.version ?? "—"}</span></div>
                <div style={{ gridColumn: "1/-1" }}>
                  <span style={{ color: "#6B7280" }}>Last seen: </span>
                  <span style={{ color: "#D1D5DB" }}>{a.last_heartbeat ? new Date(a.last_heartbeat).toLocaleString() : "Never"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {a.status !== "Online" && (
                  <button onClick={() => handleStatusChange(a.uuid, "Online")} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #22C55E40", background: "transparent", color: "#22C55E", cursor: "pointer", fontSize: 12 }}>
                    Enable
                  </button>
                )}
                {a.status !== "Disabled" && (
                  <button onClick={() => handleStatusChange(a.uuid, "Disabled")} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 12 }}>
                    Disable
                  </button>
                )}
                <button onClick={() => handleDelete(a.uuid)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #EF444430", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 12 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
