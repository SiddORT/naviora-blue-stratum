"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { featureService } from "@/services/plans.service";
import { FeatureFormDialog } from "./FeatureFormDialog";
import type { Feature } from "@/types/plan.types";
import { FEATURE_CATEGORIES } from "@/types/plan.types";

const CAT_COLORS: Record<string, string> = {
  AI: "bg-[#2EA8FF]/10 text-[#2EA8FF] border-[#2EA8FF]/20",
  Simulator: "bg-[#D4A63A]/10 text-[#D4A63A] border-[#D4A63A]/20",
  Reporting: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Offline: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function FeaturesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["features", page, search, categoryFilter],
    queryFn: async () => {
      const res = await featureService.list({ page, page_size: 20, search: search || undefined, category: categoryFilter === "all" ? undefined : categoryFilter });
      return res.data;
    },
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => featureService.delete(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["features"] }),
  });

  const features = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search features..." className="pl-9 bg-background border-border" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 bg-background border-border"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent className="bg-surface border-border">
            <SelectItem value="all">All Categories</SelectItem>
            {FEATURE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> New Feature
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              {["Feature Name", "Code", "Category", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface rounded animate-pulse w-24" /></td>)}</tr>
              ))
            ) : features.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No features found</td></tr>
            ) : features.map((f) => (
              <tr key={f.uuid} className="hover:bg-surface/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div>{f.feature_name}</div>
                  {f.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.feature_code}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${CAT_COLORS[f.category] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>{f.category}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${f.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>
                    {f.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditing(f)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                      onClick={() => { if (confirm(`Delete feature "${f.feature_name}"?`)) deleteMutation.mutate(f.uuid); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} features total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <FeatureFormDialog open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} feature={editing} />
    </div>
  );
}
