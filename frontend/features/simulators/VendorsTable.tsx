"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";
import type { SimulatorVendor } from "@/types/simulator.types";
import { VendorFormDrawer } from "./VendorFormDrawer";

const statusColors: Record<string, string> = {
  active:     "bg-green-500/15 text-green-400",
  inactive:   "bg-muted text-muted-foreground",
  deprecated: "bg-orange-500/15 text-orange-400",
};

const integrationTypeColors: Record<string, string> = {
  REST_API:    "bg-primary/15 text-primary",
  WEBSOCKET:   "bg-purple-500/15 text-purple-400",
  FILE_IMPORT: "bg-amber-500/15 text-amber-400",
  CUSTOM:      "bg-muted text-muted-foreground",
};

export function VendorsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [intType, setIntType] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SimulatorVendor | null>(null);
  const pageSize = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["simulator-vendors", page, search, status, intType],
    queryFn: () =>
      simulatorsService.listVendors({
        page, page_size: pageSize,
        search: search || undefined,
        status: status || undefined,
        integration_type: intType || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => simulatorsService.deleteVendor(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulator-vendors"] }),
  });

  const paged = data?.data;
  const vendors: SimulatorVendor[] = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const totalPages = paged?.total_pages ?? 1;

  function openCreate() { setEditing(null); setDrawerOpen(true); }
  function openEdit(v: SimulatorVendor) { setEditing(v); setDrawerOpen(true); }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deprecated">Deprecated</option>
          </select>

          <select
            value={intType}
            onChange={(e) => { setIntType(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">All Integration Types</option>
            <option value="REST_API">REST API</option>
            <option value="WEBSOCKET">WebSocket</option>
            <option value="FILE_IMPORT">File Import</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-2 gradient-gold text-black text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Name", "Code", "Vendor", "Version", "Integration Type", "Status", "Created On", "Actions"].map((h) => (
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {search || status || intType ? "No vendors match your filters." : "No simulator vendors found. Add your first vendor."}
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.uuid} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{v.name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.version ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", integrationTypeColors[v.integration_type] ?? "bg-muted text-muted-foreground")}>
                        {v.integration_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[v.status] ?? "bg-muted text-muted-foreground")}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          title="Edit"
                          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete vendor "${v.name}"?`)) deleteMutation.mutate(v.uuid);
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

        {/* Pagination */}
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

      <VendorFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        vendor={editing}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["simulator-vendors"] })}
      />
    </div>
  );
}
