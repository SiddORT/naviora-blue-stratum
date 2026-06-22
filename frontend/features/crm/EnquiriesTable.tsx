"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, AlertTriangle,
  Eye, CheckCircle, XCircle, RefreshCw, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enquiriesService } from "@/services/enquiries.service";
import type { EnquiryListItem, EnquiryStatus, EnquiryType } from "@/types/common.types";

const TYPE_LABELS: Record<EnquiryType, string> = {
  CONTACT:                  "Contact",
  CUSTOM_PLAN:              "Custom Plan",
  ORGANIZATION_REGISTRATION: "Org Registration",
  CANDIDATE_REGISTRATION:   "Candidate Reg.",
};

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW:       "bg-[#2EA8FF]/15 text-[#2EA8FF]",
  CONTACTED: "bg-yellow-500/15 text-yellow-400",
  QUALIFIED: "bg-purple-500/15 text-purple-400",
  APPROVED:  "bg-green-500/15 text-green-400",
  REJECTED:  "bg-red-500/15 text-red-400",
  CONVERTED: "bg-[#D4A63A]/15 text-[#D4A63A]",
};

const TYPE_COLORS: Record<EnquiryType, string> = {
  CONTACT:                   "bg-slate-500/15 text-slate-400",
  CUSTOM_PLAN:               "bg-purple-500/15 text-purple-400",
  ORGANIZATION_REGISTRATION: "bg-[#2EA8FF]/15 text-[#2EA8FF]",
  CANDIDATE_REGISTRATION:    "bg-[#D4A63A]/15 text-[#D4A63A]",
};

const ALL_TYPES: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "CONTACT", label: "Contact" },
  { value: "CUSTOM_PLAN", label: "Custom Plan" },
  { value: "ORGANIZATION_REGISTRATION", label: "Org Registration" },
  { value: "CANDIDATE_REGISTRATION", label: "Candidate Reg." },
];

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CONVERTED", label: "Converted" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function EnquiriesTable() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [rejectUuid, setRejectUuid] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["enquiries", page, search, typeFilter, statusFilter],
    queryFn: () =>
      enquiriesService.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        enquiry_type: typeFilter || undefined,
        status: statusFilter || undefined,
        sort_by: "created_at",
        sort_order: "desc",
      }),
  });

  const reject = useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason: string }) =>
      enquiriesService.reject(uuid, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enquiries"] });
      setRejectUuid(null);
      setRejectReason("");
    },
  });

  const items: EnquiryListItem[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.total_pages ?? 1;

  const inputCls =
    "bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, organization..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`${inputCls} pl-9 w-full`}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
            showFilters
              ? "border-primary text-primary bg-primary/10"
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
        <span className="text-sm text-muted-foreground ml-auto">
          {total} {total === 1 ? "enquiry" : "enquiries"}
        </span>
      </div>

      {/* Filters row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border bg-[#141821]">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className={`${inputCls} min-w-[160px]`}
          >
            {ALL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`${inputCls} min-w-[140px]`}
          >
            {ALL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {(typeFilter || statusFilter || search) && (
            <button
              onClick={() => { setTypeFilter(""); setStatusFilter(""); setSearch(""); setPage(1); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B0B0F] border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#1E2430] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground text-sm">
                        No enquiries found
                      </td>
                    </tr>
                  )
                : items.map((enq) => (
                    <tr key={enq.uuid} className="hover:bg-[#1E2430]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-foreground">
                              {enq.first_name} {enq.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{enq.email}</div>
                          </div>
                          {enq.duplicate_flag && (
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" title="Possible duplicate" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[enq.enquiry_type])}>
                          {TYPE_LABELS[enq.enquiry_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{enq.company_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{enq.selected_plan_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{enq.country ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[enq.status])}>
                          {enq.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(enq.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/admin/crm/enquiries/${enq.uuid}`)}
                            className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground hover:text-foreground transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {enq.status !== "APPROVED" && enq.status !== "REJECTED" && enq.status !== "CONVERTED" && (
                            <button
                              onClick={() => router.push(`/admin/crm/enquiries/${enq.uuid}`)}
                              className="p-1.5 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {enq.status !== "REJECTED" && enq.status !== "CONVERTED" && (
                            <button
                              onClick={() => setRejectUuid(enq.uuid)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {enq.status === "APPROVED" && (
                            <button
                              onClick={() => enquiriesService.convert(enq.uuid).then(() => qc.invalidateQueries({ queryKey: ["enquiries"] }))}
                              className="p-1.5 rounded hover:bg-[#D4A63A]/10 text-muted-foreground hover:text-[#D4A63A] transition-colors"
                              title="Mark converted"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[#0B0B0F]">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-[#1E2430] text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectUuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-[#141821] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reject Enquiry</h3>
            <p className="text-sm text-muted-foreground">
              Provide an optional reason. This will be recorded as an internal note.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectUuid(null); setRejectReason(""); }}
                className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reject.mutate({ uuid: rejectUuid, reason: rejectReason })}
                disabled={reject.isPending}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              >
                {reject.isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
