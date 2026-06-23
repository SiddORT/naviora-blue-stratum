"use client";

import { useCallback, useEffect, useState } from "react";
import { certificateService } from "@/services/certificate.service";
import type { CertificateRule, CertificateTemplate } from "@/types/certificate.types";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface FormState {
  assessment_id: string;
  template_id: string;
  minimum_score: string;
  require_review_approval: boolean;
  auto_issue: boolean;
  validity_period_months: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: FormState = {
  assessment_id: "", template_id: "", minimum_score: "80",
  require_review_approval: false, auto_issue: true, validity_period_months: "12", status: "active",
};

export function AdminRulesView() {
  const [items, setItems] = useState<CertificateRule[]>([]);
  const [total, setTotal] = useState(0);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; uuid?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string } | null>(null);
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, tmplRes] = await Promise.all([
        certificateService.listRules({ page: 1, page_size: pageSize }),
        certificateService.listTemplates({ page: 1, page_size: 100, status: "active" }),
      ]);
      if (rulesRes.success && rulesRes.data) { setItems(rulesRes.data.items); setTotal(rulesRes.data.total); }
      if (tmplRes.success && tmplRes.data) setTemplates(tmplRes.data.items);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ mode: "create" }); };
  const openEdit = (r: CertificateRule) => {
    setForm({
      assessment_id: String(r.assessment_id),
      template_id: r.template_id ? String(r.template_id) : "",
      minimum_score: String(r.minimum_score),
      require_review_approval: r.require_review_approval,
      auto_issue: r.auto_issue,
      validity_period_months: r.validity_period_months ? String(r.validity_period_months) : "",
      status: r.status,
    });
    setModal({ mode: "edit", uuid: r.uuid });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        assessment_id: parseInt(form.assessment_id),
        template_id: form.template_id ? parseInt(form.template_id) : null,
        minimum_score: parseFloat(form.minimum_score),
        require_review_approval: form.require_review_approval,
        auto_issue: form.auto_issue,
        validity_period_months: form.validity_period_months ? parseInt(form.validity_period_months) : null,
        status: form.status,
      };
      if (modal?.mode === "create") await certificateService.createRule(body);
      else if (modal?.uuid) await certificateService.updateRule(modal.uuid, body);
      setModal(null);
      load();
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await certificateService.deleteRule(deleteTarget.uuid);
    setDeleteTarget(null);
    load();
  };

  const BoolIcon = ({ val }: { val: boolean }) => val
    ? <CheckCircle2 size={16} color="#22C55E" />
    : <XCircle size={16} color="#EF4444" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          <Plus size={16} /> New Rule
        </button>
      </div>

      <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2430" }}>
                {["Assessment", "Template", "Min Score", "Auto Issue", "Review Required", "Validity (months)", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>No rules defined. Create your first rule to enable certificate issuance.</td></tr>
              ) : items.map(r => (
                <tr key={r.uuid} style={{ borderBottom: "1px solid #1E2430" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#0B0B0F"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#F9FAFB" }}>{r.assessment_name ?? `Assessment #${r.assessment_id}`}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF" }}>{r.template_name ?? "Default"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#D4A63A", fontWeight: 600 }}>{r.minimum_score}%</td>
                  <td style={{ padding: "12px 16px" }}><BoolIcon val={r.auto_issue} /></td>
                  <td style={{ padding: "12px 16px" }}><BoolIcon val={r.require_review_approval} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF" }}>{r.validity_period_months ?? "Never"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === "active" ? "#052e16" : "#1E2430", color: r.status === "active" ? "#22C55E" : "#6B7280" }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(r)}
                        style={{ padding: "4px 10px", background: "#1E2430", border: "1px solid #374151", borderRadius: 6, color: "#9CA3AF", cursor: "pointer" }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget({ uuid: r.uuid })}
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
      </div>
      <div style={{ fontSize: 13, color: "#6B7280" }}>{total} total rules</div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 20 }}>
              {modal.mode === "create" ? "Create Certificate Rule" : "Edit Rule"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Assessment ID">
                <input type="number" value={form.assessment_id} onChange={e => setForm(f => ({ ...f, assessment_id: e.target.value }))} style={INPUT} placeholder="Assessment ID" />
              </Field>
              <Field label="Certificate Template (optional)">
                <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))} style={INPUT}>
                  <option value="">Use Default Template</option>
                  {templates.map(t => <option key={t.uuid} value={String(t.id)}>{t.template_name}</option>)}
                </select>
              </Field>
              <Field label="Minimum Score (%)">
                <input type="number" min="0" max="100" value={form.minimum_score} onChange={e => setForm(f => ({ ...f, minimum_score: e.target.value }))} style={INPUT} />
              </Field>
              <Field label="Validity Period (months, leave empty for perpetual)">
                <input type="number" min="1" value={form.validity_period_months} onChange={e => setForm(f => ({ ...f, validity_period_months: e.target.value }))} style={INPUT} placeholder="e.g. 24" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))} style={INPUT}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_issue} onChange={e => setForm(f => ({ ...f, auto_issue: e.target.checked }))} />
                <span style={{ fontSize: 14, color: "#D1D5DB" }}>Auto-issue certificate when criteria met</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.require_review_approval} onChange={e => setForm(f => ({ ...f, require_review_approval: e.target.checked }))} />
                <span style={{ fontSize: 14, color: "#D1D5DB" }}>Require reviewer approval before issuance</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.assessment_id}
                style={{ padding: "8px 18px", background: "#D4A63A", border: "none", borderRadius: 8, color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : modal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#F9FAFB", marginBottom: 10 }}>Delete Rule</h3>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>This rule will be deleted. Existing certificates will not be affected.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "8px 18px", background: "#1E2430", border: "1px solid #374151", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={doDelete} style={{ padding: "8px 18px", background: "#EF4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Delete</button>
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
