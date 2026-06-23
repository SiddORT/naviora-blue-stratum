"use client";

import { useCallback, useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateTemplate } from "@/types/certificate.types";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

const CERT_TYPES = ["Competency", "Completion", "STCW", "Professional", "Custom"];

interface FormState {
  template_name: string;
  template_code: string;
  description: string;
  certificate_type: string;
  is_default: boolean;
  status: "active" | "inactive";
}

const EMPTY_FORM: FormState = {
  template_name: "", template_code: "", description: "",
  certificate_type: "Competency", is_default: false, status: "active",
};

export function AdminTemplatesView() {
  const [items, setItems] = useState<CertificateTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; uuid?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string; name: string } | null>(null);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await certificateService.listTemplates({ page, page_size: pageSize });
      if (res.success && res.data) { setItems(res.data.items); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ mode: "create" }); };
  const openEdit = (t: CertificateTemplate) => {
    setForm({
      template_name: t.template_name, template_code: t.template_code,
      description: t.description ?? "", certificate_type: t.certificate_type,
      is_default: t.is_default, status: t.status,
    });
    setModal({ mode: "edit", uuid: t.uuid });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal?.mode === "create") {
        await certificateService.createTemplate(form);
      } else if (modal?.uuid) {
        await certificateService.updateTemplate(modal.uuid, form);
      }
      setModal(null);
      load();
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await certificateService.deleteTemplate(deleteTarget.uuid);
    setDeleteTarget(null);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          <Plus size={16} /> New Template
        </button>
      </div>

      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2430" }}>
              {["Name", "Code", "Type", "Default", "Status", "Created", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>No templates found</td></tr>
            ) : items.map(t => (
              <tr key={t.uuid} style={{ borderBottom: "1px solid #1E2430" }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#0B0B0F"}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#F9FAFB", fontWeight: 500 }}>{t.template_name}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#D4A63A", fontFamily: "monospace" }}>{t.template_code}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF" }}>{t.certificate_type}</td>
                <td style={{ padding: "12px 16px" }}>
                  {t.is_default && <Star size={14} fill="#D4A63A" color="#D4A63A" />}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: t.status === "active" ? "#052e16" : "#1E2430", color: t.status === "active" ? "#22C55E" : "#6B7280" }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(t)}
                      style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", cursor: "pointer" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget({ uuid: t.uuid, name: t.template_name })}
                      style={{ padding: "4px 10px", background: "#450a0a", border: "1px solid #991b1b", borderRadius: 6, color: "#EF4444", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 13, color: "#6B7280" }}>{total} total templates</div>

      {/* Create/Edit Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 20 }}>
              {modal.mode === "create" ? "Create Template" : "Edit Template"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Template Name">
                <input value={form.template_name} onChange={e => setForm(f => ({ ...f, template_name: e.target.value }))} style={INPUT} />
              </Field>
              <Field label="Template Code (unique identifier)">
                <input value={form.template_code} onChange={e => setForm(f => ({ ...f, template_code: e.target.value.toUpperCase() }))} style={INPUT} placeholder="e.g. STCW-BASIC" />
              </Field>
              <Field label="Certificate Type">
                <select value={form.certificate_type} onChange={e => setForm(f => ({ ...f, certificate_type: e.target.value }))} style={INPUT}>
                  {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...INPUT, resize: "vertical" }} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))} style={INPUT}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                <span style={{ fontSize: 14, color: "#D1D5DB" }}>Set as default template</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.template_name || !form.template_code}
                style={{ padding: "8px 18px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : modal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 10 }}>Archive Template</h3>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>
              Archive <strong style={{ color: "#F9FAFB" }}>{deleteTarget.name}</strong>? This will hide it from selection but not delete existing certificates.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={doDelete} style={{ padding: "8px 18px", background: "#EF4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", background: "#0B0B0F", border: "1px solid #1E2430", borderRadius: 8,
  padding: "10px 14px", color: "#F9FAFB", fontSize: 14, outline: "none", boxSizing: "border-box",
};
