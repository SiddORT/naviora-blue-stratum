"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { enquiriesService } from "@/services/enquiries.service";
import type { ConsentRecord } from "@/types/common.types";

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Flag({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
    : <XCircle    className="w-4 h-4 text-muted-foreground/40" />;
}

export function ConsentRecordsTable() {
  const [page, setPage] = useState(1);
  const [marketingOnly, setMarketingOnly] = useState(false);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["consents", page, marketingOnly],
    queryFn: () =>
      enquiriesService.listConsents({ page, page_size: pageSize, marketing_only: marketingOnly }),
  });

  const items: ConsentRecord[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.total_pages ?? 1;
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => { setMarketingOnly((v) => !v); setPage(1); }}
            className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              marketingOnly ? "bg-primary" : "bg-muted",
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
              marketingOnly ? "translate-x-4" : "translate-x-0.5",
            )} />
          </div>
          <span className="text-sm text-muted-foreground">Marketing consent only</span>
        </label>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Name / Email", "Type", "Privacy", "Terms", "Data Processing", "Marketing", "Version", "IP", "Accepted At"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-muted-foreground">
                    {marketingOnly ? "No records with marketing consent." : "No consent records found."}
                  </td>
                </tr>
              ) : items.map((c, idx) => (
                <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{c.enquiry_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{c.enquiry_email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.enquiry_type?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3"><Flag ok={c.privacy_accepted} /></td>
                  <td className="px-4 py-3"><Flag ok={c.terms_accepted} /></td>
                  <td className="px-4 py-3"><Flag ok={c.data_processing_accepted} /></td>
                  <td className="px-4 py-3"><Flag ok={c.marketing_accepted} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.consent_version ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{c.ip_address ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(c.accepted_at)}
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

      <p className="text-xs text-muted-foreground">
        Consent records are immutable. No record is ever deleted. GDPR Art. 7 compliance.
      </p>
    </div>
  );
}
