"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Pencil, Trash2, Wifi } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";
import type { SimulatorConfiguration } from "@/types/simulator.types";
import { ConfigurationFormDrawer } from "./ConfigurationFormDrawer";

const statusColors: Record<string, string> = {
  active:   "bg-green-500/15 text-green-400",
  inactive: "bg-muted text-muted-foreground",
};

const authColors: Record<string, string> = {
  API_KEY: "bg-primary/15 text-primary",
  BEARER:  "bg-purple-500/15 text-purple-400",
  BASIC:   "bg-amber-500/15 text-amber-400",
  NONE:    "bg-muted text-muted-foreground",
};

export function ConfigurationsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [authType, setAuthType] = useState("");
  const [status, setStatus] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SimulatorConfiguration | null>(null);
  const [testingUuid, setTestingUuid] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ uuid: string; success: boolean; message: string } | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["simulator-configurations", page, search, authType, status],
    queryFn: () =>
      simulatorsService.listConfigurations({
        page, page_size: pageSize,
        search: search || undefined,
        authentication_type: authType || undefined,
        status: status || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => simulatorsService.deleteConfiguration(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulator-configurations"] }),
  });

  async function handleTest(uuid: string) {
    setTestingUuid(uuid);
    try {
      const res = await simulatorsService.testConnection(uuid);
      setTestResult({ uuid, success: res.data?.success ?? false, message: res.data?.message ?? "Test complete" });
    } catch {
      setTestResult({ uuid, success: false, message: "Connection test failed" });
    } finally {
      setTestingUuid(null);
    }
  }

  const paged = data?.data;
  const configs: SimulatorConfiguration[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search configurations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={authType}
            onChange={(e) => { setAuthType(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">All Auth Types</option>
            <option value="API_KEY">API Key</option>
            <option value="BEARER">Bearer</option>
            <option value="BASIC">Basic</option>
            <option value="NONE">None</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          onClick={() => { setEditing(null); setDrawerOpen(true); }}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Configuration
        </button>
      </div>

      {/* Test result banner */}
      {testResult && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm",
          testResult.success
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        )}>
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span>{testResult.message}</span>
          <button onClick={() => setTestResult(null)} className="ml-auto text-muted-foreground hover:text-foreground">
            <span className="text-xs">Dismiss</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Configuration Name", "Simulator", "Base URL", "Auth Type", "Status", "Last Updated", "Actions"].map((h) => (
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
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : configs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {search || authType || status ? "No configurations match your filters." : "No simulator configurations found."}
                  </td>
                </tr>
              ) : (
                configs.map((c) => (
                  <tr key={c.uuid} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.configuration_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.vendor_name
                        ? <div>
                            <div className="text-foreground">{c.vendor_name}</div>
                            <div className="text-xs font-mono text-muted-foreground">{c.vendor_code}</div>
                          </div>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs max-w-[180px] truncate">
                      {c.base_url ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", authColors[c.authentication_type] ?? "bg-muted text-muted-foreground")}>
                        {c.authentication_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[c.status] ?? "bg-muted text-muted-foreground")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(c.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTest(c.uuid)}
                          disabled={testingUuid === c.uuid}
                          title="Test connection"
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                        >
                          <Wifi className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditing(c); setDrawerOpen(true); }}
                          title="Edit"
                          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete configuration "${c.configuration_name}"?`)) deleteMutation.mutate(c.uuid);
                          }}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
            <div className="text-xs text-muted-foreground">
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-foreground">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfigurationFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        config={editing}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["simulator-configurations"] })}
      />
    </div>
  );
}
