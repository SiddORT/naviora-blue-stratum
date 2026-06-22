"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
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
    ? <CheckCircle className="w-4 h-4 text-green-400" />
    : <XCircle    className="w-4 h-4 text-red-400/50" />;
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => { setMarketingOnly((v) => !v); setPage(1); }}
            className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              marketingOnly ? "bg-[#D4A63A]" : "bg-[#1E2430]",
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
              marketingOnly ? "translate-x-4" : "translate-x-0.5",
            )} />
          </div>
          <span className="text-sm text-muted-foreground">Marketing consent only</span>
        </label>
        <span className="text-sm text-muted-foreground ml-auto">{total} records</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B0B0F] border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name / Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Privacy</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Processing</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marketing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accepted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#1E2430] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground text-sm">
                        No consent records found
                      </td>
                    </tr>
                  )
                : items.map((c) => (
                    <tr key={c.id} className="hover:bg-[#1E2430]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.enquiry_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{c.enquiry_email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.enquiry_type?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center"><Flag ok={c.privacy_accepted} /></td>
                      <td className="px-4 py-3 text-center"><Flag ok={c.terms_accepted} /></td>
                      <td className="px-4 py-3 text-center"><Flag ok={c.data_processing_accepted} /></td>
                      <td className="px-4 py-3 text-center"><Flag ok={c.marketing_accepted} /></td>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[#0B0B0F]">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Consent records are immutable. No record is ever deleted. GDPR Art. 7 compliance.
      </p>
    </div>
  );
}
