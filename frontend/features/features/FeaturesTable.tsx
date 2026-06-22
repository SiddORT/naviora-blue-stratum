"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { featureService } from "@/services/plans.service";
import { FeatureFormDialog } from "./FeatureFormDialog";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Feature } from "@/types/plan.types";
import { FEATURE_CATEGORIES } from "@/types/plan.types";

const CAT_COLORS: Record<string, string> = {
  AI:        "bg-secondary/10 text-secondary",
  Simulator: "bg-primary/10 text-primary",
  Reporting: "bg-violet-500/15 text-violet-400",
  Offline:   "bg-emerald-500/15 text-emerald-400",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function FeaturesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["features", page, search, categoryFilter],
    queryFn: async () => {
      const res = await featureService.list({ page, page_size: pageSize, search: search || undefined, category: categoryFilter || undefined });
      return res.data;
    },
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => featureService.delete(uuid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      setDeleteTarget(null);
    },
  });

  const features = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search features..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Categories</option>
          {FEATURE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Feature
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Feature Name", "Code", "Category", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : features.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                    {search || categoryFilter ? "No features match your filters." : "No features yet. Click \"New Feature\" to create one."}
                  </td>
                </tr>
              ) : features.map((f, idx) => (
                <tr key={f.uuid} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{f.feature_name}</div>
                    {f.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.feature_code}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", CAT_COLORS[f.category] ?? "bg-muted text-muted-foreground")}>
                      {f.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", f.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(f)} title="Edit" className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(f)} title="Delete" className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {total === 0 ? "No records" : `Showing ${fromRow}–${toRow} of ${total}`}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>

      <FeatureFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} feature={editing} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Feature"
        message={`Are you sure you want to delete "${deleteTarget?.feature_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
