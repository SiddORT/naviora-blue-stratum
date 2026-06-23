"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { enquiriesService } from "@/services/enquiries.service";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { EnquiryListItem, EnquiryStatus, EnquiryType } from "@/types/common.types";

const TYPE_LABELS: Record<EnquiryType, string> = {
  CONTACT:                   "Contact",
  CUSTOM_PLAN:               "Custom Plan",
  ORGANIZATION_REGISTRATION: "Org Registration",
  CANDIDATE_REGISTRATION:    "Candidate Reg.",
};

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW:       "bg-secondary/15 text-secondary",
  CONTACTED: "bg-amber-500/15 text-amber-400",
  QUALIFIED: "bg-purple-500/15 text-purple-400",
  APPROVED:  "bg-emerald-500/15 text-emerald-400",
  REJECTED:  "bg-destructive/15 text-destructive",
  CONVERTED: "bg-primary/15 text-primary",
};

const TYPE_COLORS: Record<EnquiryType, string> = {
  CONTACT:                   "bg-muted text-muted-foreground",
  CUSTOM_PLAN:               "bg-purple-500/15 text-purple-400",
  ORGANIZATION_REGISTRATION: "bg-secondary/15 text-secondary",
  CANDIDATE_REGISTRATION:    "bg-primary/15 text-primary",
};

const inputClass = "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function EnquiriesTable() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
            placeholder="Search by name, email, organization..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(inputClass, "pl-9 w-full")}
          />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Types</option>
          <option value="CONTACT">Contact</option>
          <option value="CUSTOM_PLAN">Custom Plan</option>
          <option value="ORGANIZATION_REGISTRATION">Org Registration</option>
          <option value="CANDIDATE_REGISTRATION">Candidate Reg.</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CONVERTED">Converted</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["#", "Name", "Type", "Organization", "Plan", "Country", "Status", "Created", "Actions"].map((h) => (
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-muted-foreground">
                    {search || typeFilter || statusFilter ? "No enquiries match your filters." : "No enquiries yet."}
                  </td>
                </tr>
              ) : items.map((enq, idx) => (
                <tr key={enq.uuid} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground w-10 tabular-nums">{fromRow + idx}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-foreground">{enq.first_name} {enq.last_name}</div>
                        <div className="text-xs text-muted-foreground">{enq.email}</div>
                      </div>
                      {enq.duplicate_flag && (
                        <span title="Possible duplicate">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[enq.enquiry_type])}>
                      {TYPE_LABELS[enq.enquiry_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{enq.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{enq.selected_plan_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{enq.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_COLORS[enq.status])}>
                      {enq.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(enq.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/crm/enquiries/${enq.uuid}`)}
                        title="View"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {enq.status !== "APPROVED" && enq.status !== "REJECTED" && enq.status !== "CONVERTED" && (
                        <button
                          onClick={() => router.push(`/admin/crm/enquiries/${enq.uuid}`)}
                          title="Approve"
                          className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {enq.status !== "REJECTED" && enq.status !== "CONVERTED" && (
                        <button
                          onClick={() => setRejectUuid(enq.uuid)}
                          title="Reject"
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {enq.status === "APPROVED" && (
                        <button
                          onClick={() => enquiriesService.convert(enq.uuid).then(() => qc.invalidateQueries({ queryKey: ["enquiries"] }))}
                          title="Mark converted"
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
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

      {/* Reject modal */}
      {rejectUuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reject Enquiry</h3>
            <p className="text-sm text-muted-foreground">
              Provide an optional reason. This will be recorded as an internal note.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectUuid(null); setRejectReason(""); }}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reject.mutate({ uuid: rejectUuid, reason: rejectReason })}
                disabled={reject.isPending}
                className="px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
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
