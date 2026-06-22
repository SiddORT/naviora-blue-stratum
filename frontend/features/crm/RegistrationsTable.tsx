"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { enquiriesService } from "@/services/enquiries.service";
import type { OnboardingRequest, OnboardingStatus, OnboardingType } from "@/types/common.types";

const TYPE_LABELS: Record<OnboardingType, string> = {
  ORGANIZATION: "Organization",
  CANDIDATE:    "Candidate",
};

const STATUS_COLORS: Record<OnboardingStatus, string> = {
  PENDING:   "bg-yellow-500/15 text-yellow-400",
  APPROVED:  "bg-green-500/15 text-green-400",
  REJECTED:  "bg-red-500/15 text-red-400",
  CONVERTED: "bg-[#D4A63A]/15 text-[#D4A63A]",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function RegistrationsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", page, typeFilter, statusFilter],
    queryFn: () =>
      enquiriesService.listOnboarding({
        page,
        page_size: pageSize,
        onboarding_type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const items: OnboardingRequest[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.total_pages ?? 1;

  const selectCls =
    "bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Types</option>
          <option value="ORGANIZATION">Organization</option>
          <option value="CANDIDATE">Candidate</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CONVERTED">Converted</option>
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{total} requests</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B0B0F] border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#1E2430] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground text-sm">
                        No registration requests found
                      </td>
                    </tr>
                  )
                : items.map((req) => (
                    <tr key={req.uuid} className="hover:bg-[#1E2430]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{req.enquiry_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{req.enquiry_email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {TYPE_LABELS[req.onboarding_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[req.onboarding_status])}>
                          {req.onboarding_status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">
                        {req.approved_by ? req.approved_by.slice(0, 8) + "..." : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {req.approved_at ? formatDate(req.approved_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => router.push(`/admin/crm/enquiries/${req.enquiry_id}`)}
                            className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground hover:text-foreground transition-colors"
                            title="View enquiry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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
    </div>
  );
}
