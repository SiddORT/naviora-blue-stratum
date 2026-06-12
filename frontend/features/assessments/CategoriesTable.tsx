"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, PowerOff, Power, X, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { assessmentCategoryService } from "@/services/assessments.service";
import { toast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { AssessmentCategory } from "@/types/assessment.types";

const schema = z.object({
  category_name: z.string().min(2, "Name required").max(255),
  category_code: z.string().min(2, "Code required").max(50),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";
const filterInput = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
};

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}

export function CategoriesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AssessmentCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentCategory | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();
  const codeManual = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assessment-categories", page, search, status],
    queryFn: () => assessmentCategoryService.list({ page, page_size: pageSize, search: search || undefined, status: status || undefined }),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const isEdit = !!editItem;
  const nameVal = watch("category_name");

  useEffect(() => {
    if (formOpen) {
      codeManual.current = false;
      reset(editItem ? {
        category_name: editItem.category_name, category_code: editItem.category_code,
        description: editItem.description ?? "", status: editItem.status as "active" | "inactive",
      } : { status: "active" });
    }
  }, [formOpen, editItem, reset]);

  useEffect(() => {
    if (!isEdit && !codeManual.current && nameVal) setValue("category_code", toCode(nameVal));
  }, [nameVal, isEdit, setValue]);

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => isEdit ? assessmentCategoryService.update(editItem!.uuid, d) : assessmentCategoryService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-categories"] }); toast({ variant: "success", title: isEdit ? "Category updated" : "Category created" }); closeForm(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => assessmentCategoryService.delete(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-categories"] }); setDeleteTarget(null); toast({ variant: "success", title: "Category deleted" }); },
    onError: (e: Error) => { setDeleteTarget(null); toast({ variant: "destructive", title: "Delete failed", description: e.message }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => active ? assessmentCategoryService.deactivate(uuid) : assessmentCategoryService.activate(uuid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessment-categories"] }); toast({ variant: "success", title: "Status updated" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  function closeForm() { setFormOpen(false); setEditItem(null); }

  const paged = data?.data;
  const items: AssessmentCategory[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={cn(filterInput, "pl-9 w-full")} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={filterInput}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {formOpen && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{isEdit ? "Edit Category" : "New Assessment Category"}</h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category Name" required error={errors.category_name?.message}>
              <input {...register("category_name")} className={inputClass} placeholder="e.g. COLREG" />
            </Field>
            <Field label="Category Code" required error={errors.category_code?.message}>
              <input {...register("category_code")} className={inputClass} placeholder="e.g. COLREG" onFocus={() => { codeManual.current = true; }} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <input {...register("description")} className={inputClass} placeholder="Optional description" />
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-gold text-black hover:opacity-90 disabled:opacity-50 transition-opacity">
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["#", "Name", "Code", "Description", "Status", "Updated", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No categories found.</td></tr>
              ) : items.map((item, idx) => (
                <tr key={item.uuid} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{item.category_name}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{item.category_code}</span></td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[item.status] ?? "bg-muted text-muted-foreground")}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(item.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditItem(item); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMutation.mutate({ uuid: item.uuid, active: item.is_active })} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={item.is_active ? "Deactivate" : "Activate"}>{item.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        description={`Delete "${deleteTarget?.category_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
