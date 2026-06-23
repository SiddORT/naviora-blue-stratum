"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FileText, X, Save, Send, ChevronLeft } from "lucide-react";
import { settingsService, type EmailTemplate } from "@/services/settings.service";
import { cn } from "@/lib/utils";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-amber-500/15 text-amber-400",
  archived: "bg-muted text-muted-foreground",
};

const VARIABLES = [
  "user_name", "organization_name", "platform_name", "support_email",
  "activation_link", "temporary_password", "reset_link", "expiry_minutes",
  "assessment_name", "candidate_name", "due_date", "assessment_link",
  "login_url", "organization_url", "admin_email",
];

// ── Template Form ─────────────────────────────────────────────────────────────

function TemplateForm({
  template,
  onSave,
  onCancel,
  isSaving,
}: {
  template: Partial<EmailTemplate> | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    template_name: template?.template_name || "",
    template_code: template?.template_code || "",
    subject: template?.subject || "",
    html_content: template?.html_content || "",
    plain_text_content: template?.plain_text_content || "",
    available_variables: template?.available_variables || "[]",
    status: template?.status || "draft",
    description: template?.description || "",
  });
  const [tab, setTab] = useState<"html" | "text" | "preview">("html");
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<{ subject: string; html_content: string } | null>(null);

  const isNew = !template?.uuid;

  const handleInsertVar = (v: string) => {
    setForm((f) => ({ ...f, html_content: (f.html_content || "") + `{{${v}}}` }));
  };

  const runPreview = () => {
    const subj = form.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => previewVars[k] || `[${k}]`);
    const html = form.html_content.replace(/\{\{(\w+)\}\}/g, (_, k) => previewVars[k] || `[${k}]`);
    setPreviewResult({ subject: subj, html_content: html });
    setTab("preview");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{isNew ? "New Email Template" : `Edit: ${template?.template_name}`}</h2>
          <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} syntax for dynamic placeholders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Template Name</label>
                <input value={form.template_name} onChange={(e) => setForm((f) => ({ ...f, template_name: e.target.value }))} className={inputClass} placeholder="Admin User Invitation" />
              </div>
              <div>
                <label className={labelClass}>Template Code</label>
                <input
                  value={form.template_code}
                  onChange={(e) => setForm((f) => ({ ...f, template_code: e.target.value.toUpperCase().replace(/\s+/g, "_") }))}
                  className={`${inputClass} font-mono`}
                  placeholder="ADMIN_USER_INVITATION"
                  disabled={!isNew}
                />
                {!isNew && <p className="text-xs text-muted-foreground mt-1">Template code cannot be changed after creation.</p>}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Email Subject</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className={inputClass} placeholder="You have been invited to {{platform_name}}" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} placeholder="Brief description of this template" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex border-b border-border">
              {(["html", "text", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { if (t === "preview") runPreview(); else setTab(t); }}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium transition-colors",
                    tab === t ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "html" ? "HTML Content" : t === "text" ? "Plain Text" : "Preview"}
                </button>
              ))}
            </div>

            {tab === "html" && (
              <textarea
                value={form.html_content}
                onChange={(e) => setForm((f) => ({ ...f, html_content: e.target.value }))}
                rows={20}
                className="w-full bg-background text-sm text-foreground font-mono p-4 focus:outline-none resize-none"
                placeholder="<!DOCTYPE html><html>...</html>"
              />
            )}

            {tab === "text" && (
              <textarea
                value={form.plain_text_content}
                onChange={(e) => setForm((f) => ({ ...f, plain_text_content: e.target.value }))}
                rows={20}
                className="w-full bg-background text-sm text-foreground font-mono p-4 focus:outline-none resize-none"
                placeholder="Plain text version of the email..."
              />
            )}

            {tab === "preview" && previewResult && (
              <div className="p-4 space-y-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-sm font-medium text-foreground">{previewResult.subject}</p>
                </div>
                <div className="bg-white rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewResult.html_content}
                    className="w-full h-96 border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Available Variables</h4>
            <p className="text-xs text-muted-foreground mb-3">Click to insert into HTML content</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVar(v)}
                  className="text-xs bg-secondary/20 text-secondary hover:bg-secondary/30 px-2 py-1 rounded font-mono transition-colors"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview Variables</h4>
            <p className="text-xs text-muted-foreground mb-3">Set test values to preview the rendered template</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {VARIABLES.map((v) => (
                <div key={v}>
                  <label className="text-xs text-muted-foreground font-mono mb-0.5 block">{`{{${v}}}`}</label>
                  <input
                    value={previewVars[v] || ""}
                    onChange={(e) => setPreviewVars((p) => ({ ...p, [v]: e.target.value }))}
                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder={`test_${v}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving || !form.template_name || !form.template_code || !form.subject}
          onClick={() => onSave({ ...form })}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {isSaving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────

interface MenuState { uuid: string; x: number; y: number; template: EmailTemplate }

export function EmailTemplatesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<EmailTemplate | null | "new">(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const pageSize = 20;

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenuFor = useCallback((e: React.MouseEvent<HTMLButtonElement>, template: EmailTemplate) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ uuid: template.uuid, template, x: rect.right, y: rect.bottom + 4 });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates", page, search, statusFilter],
    queryFn: () => settingsService.listEmailTemplates({ page, page_size: pageSize, search: search || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsService.createEmailTemplate(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Record<string, unknown> }) =>
      settingsService.updateEmailTemplate(uuid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => settingsService.deleteEmailTemplate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); setMenu(null); },
  });

  const templates = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.total_pages ?? 1;

  if (editing !== null) {
    const template = editing === "new" ? null : editing;
    return (
      <TemplateForm
        template={template}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onCancel={() => setEditing(null)}
        onSave={(formData) => {
          if (template?.uuid) {
            updateMutation.mutate({ uuid: template.uuid, data: formData });
          } else {
            createMutation.mutate(formData);
          }
        }}
      />
    );
  }

  return (
    <>
      {menu && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeMenu}
          onKeyDown={(e) => e.key === "Escape" && closeMenu()}
        />
      )}
      {menu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl py-1 w-44"
          style={{ top: menu.y, right: `calc(100vw - ${menu.x}px)` }}
        >
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => { setEditing(menu.template); setMenu(null); }}
          >
            <Edit size={13} /> Edit Template
          </button>
          <div className="border-t border-border my-1" />
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => deleteMutation.mutate(menu.uuid)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search templates..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus size={14} /> New Template
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading templates...</td></tr>
                ) : templates.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">No templates found.</td></tr>
                ) : (
                  templates.map((tpl) => (
                    <tr key={tpl.uuid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText size={12} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{tpl.template_name}</p>
                            {tpl.description && <p className="text-xs text-muted-foreground">{tpl.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">{tpl.template_code}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-foreground truncate">{tpl.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[tpl.status] ?? "bg-muted text-muted-foreground")}>
                          {tpl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => openMenuFor(e, tpl)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{total} templates</p>
              <div className="flex gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
