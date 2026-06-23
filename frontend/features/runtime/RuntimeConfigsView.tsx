"use client";

import { useCallback, useEffect, useState } from "react";
import { runtimeService, type RuntimeConfig } from "@/services/runtime.service";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { simulatorsService } from "@/services/simulators.service";

const MODES = ["CLOUD_API", "DESKTOP_OFFLINE", "MANUAL"];

const inputStyle = { width: "100%", background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 6, padding: "8px 12px", color: "#F9FAFB", fontSize: 13, boxSizing: "border-box" as const };

const EMPTY_FORM = { simulator_vendor_id: 0, config_name: "", runtime_mode: "CLOUD_API", api_endpoint: "", executable_path: "", working_directory: "", launch_arguments: "", result_directory: "", auto_sync: false, is_default: false, notes: "" };

export function RuntimeConfigsView() {
  const [configs, setConfigs] = useState<RuntimeConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<{ id: number; name: string; code: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RuntimeConfig | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runtimeService.listConfigs({ page: 1, page_size: 50 });
      if (res.success) { setConfigs(res.data!.items); setTotal(res.data!.total); }
    } finally { setLoading(false); }
  }, []);

  const loadVendors = useCallback(async () => {
    const res = await simulatorsService.listVendors({ page: 1, page_size: 100 });
    if (res.success) setVendors(res.data?.items?.map((v: Record<string, unknown>) => ({ id: v.id as number, name: v.name as string, code: v.code as string })) ?? []);
  }, []);

  useEffect(() => { load(); loadVendors(); }, [load, loadVendors]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (c: RuntimeConfig) => {
    setEditing(c);
    setForm({ simulator_vendor_id: c.simulator_vendor_id, config_name: c.config_name, runtime_mode: c.runtime_mode, api_endpoint: c.api_endpoint ?? "", executable_path: c.executable_path ?? "", working_directory: c.working_directory ?? "", launch_arguments: c.launch_arguments ?? "", result_directory: c.result_directory ?? "", auto_sync: c.auto_sync, is_default: c.is_default, notes: c.notes ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, simulator_vendor_id: Number(form.simulator_vendor_id) };
    if (editing) await runtimeService.updateConfig(editing.uuid, payload);
    else await runtimeService.createConfig(payload);
    setSaving(false); setShowForm(false); load();
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Delete this configuration?")) return;
    await runtimeService.deleteConfig(uuid);
    load();
  };

  const f = (key: keyof typeof EMPTY_FORM, label: string, type = "text", hint?: string) => (
    <div>
      <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>{label}{hint && <span style={{ color: "#6B7280" }}> ({hint})</span>}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: "#D4A63A", color: "#0B0B0F", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <Plus size={14} />New Configuration
        </button>
      </div>

      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2430" }}>
              {["Vendor", "Config Name", "Mode", "Default", "Status", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "12px 16px", color: "#6B7280", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
            ) : configs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>No configurations yet. Create one to enable simulator runtime.</td></tr>
            ) : configs.map(c => (
              <tr key={c.uuid} style={{ borderBottom: "1px solid #1E2430" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ color: "#F9FAFB" }}>{c.vendor_name ?? "—"}</div>
                  {c.vendor_code && <div style={{ fontSize: 11, color: "#6B7280" }}>{c.vendor_code}</div>}
                </td>
                <td style={{ padding: "12px 16px", color: "#D1D5DB" }}>{c.config_name}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "#1E2430", color: "#9CA3AF" }}>{c.runtime_mode}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {c.is_default ? <span style={{ fontSize: 11, color: "#22C55E" }}>Default</span> : <span style={{ fontSize: 11, color: "#6B7280" }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: c.status === "active" ? "#22C55E20" : "#EF444420", color: c.status === "active" ? "#22C55E" : "#EF4444" }}>{c.status}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(c)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #1E2430", background: "transparent", color: "#2EA8FF", cursor: "pointer", fontSize: 12 }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(c.uuid)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #EF444430", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 12 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 50 }}>
          <div style={{ width: 480, height: "100vh", background: "#141821", borderLeft: "1px solid #1E2430", padding: 28, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB" }}>{editing ? "Edit Configuration" : "New Configuration"}</h3>
            <div>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Simulator Vendor</label>
              <select value={form.simulator_vendor_id} onChange={e => setForm(p => ({ ...p, simulator_vendor_id: Number(e.target.value) }))} style={inputStyle}>
                <option value={0}>Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
              </select>
            </div>
            {f("config_name", "Configuration Name")}
            <div>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Runtime Mode</label>
              <select value={form.runtime_mode} onChange={e => setForm(p => ({ ...p, runtime_mode: e.target.value }))} style={inputStyle}>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {form.runtime_mode === "CLOUD_API" && f("api_endpoint", "API Endpoint", "text", "CLOUD_API only")}
            {form.runtime_mode === "DESKTOP_OFFLINE" && (
              <>
                {f("executable_path", "Executable Path")}
                {f("working_directory", "Working Directory")}
                {f("launch_arguments", "Launch Arguments")}
                {f("result_directory", "Result Directory")}
              </>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#D1D5DB", cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_sync} onChange={e => setForm(p => ({ ...p, auto_sync: e.target.checked }))} />Auto Sync
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#D1D5DB", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} />Set as Default
              </label>
            </div>
            {f("notes", "Notes")}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#D4A63A", color: "#0B0B0F", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
