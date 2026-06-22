"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Building2, Mail, Phone, Globe, FileText,
  MessageSquare, Shield, Clock, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Plus, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enquiriesService } from "@/services/enquiries.service";
import type { EnquiryStatus } from "@/types/common.types";

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW:       "bg-[#2EA8FF]/15 text-[#2EA8FF]",
  CONTACTED: "bg-yellow-500/15 text-yellow-400",
  QUALIFIED: "bg-purple-500/15 text-purple-400",
  APPROVED:  "bg-green-500/15 text-green-400",
  REJECTED:  "bg-red-500/15 text-red-400",
  CONVERTED: "bg-[#D4A63A]/15 text-[#D4A63A]",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

function ConsentPill({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
      checked
        ? "bg-green-500/10 border-green-500/20 text-green-400"
        : "bg-red-500/10 border-red-500/20 text-red-400",
    )}>
      {checked ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </div>
  );
}

export function EnquiryDetail({ uuid }: { uuid: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["enquiry", uuid],
    queryFn: () => enquiriesService.get(uuid),
  });

  const addNote = useMutation({
    mutationFn: (n: string) => enquiriesService.addNote(uuid, n),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enquiry", uuid] }); setNote(""); },
  });

  const approve = useMutation({
    mutationFn: () => enquiriesService.approve(uuid, { notes: approveNotes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enquiry", uuid] }); setShowApprove(false); },
  });

  const reject = useMutation({
    mutationFn: () => enquiriesService.reject(uuid, rejectReason || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enquiry", uuid] }); setShowReject(false); },
  });

  const convert = useMutation({
    mutationFn: () => enquiriesService.convert(uuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enquiry", uuid] }),
  });

  const updateStatus = useMutation({
    mutationFn: (s: string) => enquiriesService.updateStatus(uuid, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enquiry", uuid] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[#1E2430] rounded" />
        <div className="h-64 bg-[#141821] rounded-xl" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Enquiry not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary underline">
          Go back
        </button>
      </div>
    );
  }

  const enq = data.data;
  const c = enq.consent;
  const actionable = !["REJECTED", "CONVERTED"].includes(enq.status);

  const cardCls = "rounded-xl border border-border bg-[#141821] p-5 space-y-1";
  const sectionTitle = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push("/admin/crm/enquiries")}
          className="mt-1 p-1.5 rounded-md hover:bg-[#1E2430] text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">
              {enq.first_name} {enq.last_name}
            </h1>
            {enq.duplicate_flag && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                Possible Duplicate
              </span>
            )}
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[enq.status])}>
              {enq.status.toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {enq.enquiry_type.replace(/_/g, " ")} — submitted {formatDateTime(enq.created_at)}
          </p>
        </div>

        {/* Action buttons */}
        {actionable && (
          <div className="flex items-center gap-2 flex-wrap">
            {enq.status === "NEW" && (
              <button
                onClick={() => updateStatus.mutate("CONTACTED")}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-md bg-[#1E2430] border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark Contacted
              </button>
            )}
            {["CONTACTED", "QUALIFIED"].includes(enq.status) && (
              <button
                onClick={() => updateStatus.mutate("QUALIFIED")}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Mark Qualified
              </button>
            )}
            {enq.status !== "APPROVED" && (
              <button
                onClick={() => setShowApprove(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            )}
            {enq.status === "APPROVED" && (
              <button
                onClick={() => convert.mutate()}
                disabled={convert.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold text-black transition-opacity"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                <RefreshCw className="w-4 h-4" />
                Convert
              </button>
            )}
            <button
              onClick={() => setShowReject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — contact info + submission data */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact Information */}
          <div className={cardCls}>
            <p className={sectionTitle}>
              <User className="w-3.5 h-3.5 inline mr-1.5" />
              Contact Information
            </p>
            <InfoRow label="Full Name"    value={`${enq.first_name} ${enq.last_name}`} />
            <InfoRow label="Email"        value={enq.email} />
            <InfoRow label="Phone"        value={enq.phone} />
            <InfoRow label="Organization" value={enq.company_name} />
            <InfoRow label="Country"      value={enq.country} />
            <InfoRow label="Source Page"  value={enq.source_page} />
          </div>

          {/* Form Submission Data */}
          {enq.message && (
            <div className={cardCls}>
              <p className={sectionTitle}>
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                Message
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{enq.message}</p>
            </div>
          )}

          {/* GDPR Consent */}
          {c && (
            <div className={cardCls}>
              <p className={sectionTitle}>
                <Shield className="w-3.5 h-3.5 inline mr-1.5" />
                Consent Records (GDPR)
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <ConsentPill checked={c.privacy_accepted}         label="Privacy Policy" />
                <ConsentPill checked={c.terms_accepted}           label="Terms of Service" />
                <ConsentPill checked={c.data_processing_accepted} label="Data Processing" />
                <ConsentPill checked={c.marketing_accepted}       label="Marketing" />
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Version: {c.consent_version ?? "—"}</p>
                <p>IP: {c.ip_address ?? "—"}</p>
                <p>Recorded: {formatDateTime(c.accepted_at)}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className={cardCls}>
            <p className={sectionTitle}>
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
              Internal Notes
            </p>
            {(enq.notes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {enq.notes.map((n) => (
                  <div key={n.id} className="flex gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-[#1E2430] flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                      {n.note_by?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-foreground">{n.note_by ?? "System"}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{n.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an internal note..."
                className="flex-1 bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <button
                onClick={() => { if (note.trim()) addNote.mutate(note.trim()); }}
                disabled={!note.trim() || addNote.isPending}
                className="self-end flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-black disabled:opacity-50 transition-opacity"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                <Send className="w-3.5 h-3.5" />
                {addNote.isPending ? "..." : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — meta */}
        <div className="space-y-5">
          <div className={cardCls}>
            <p className={sectionTitle}>
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              Timeline
            </p>
            <InfoRow label="Created"  value={formatDateTime(enq.created_at)} />
            <InfoRow label="Updated"  value={formatDateTime(enq.updated_at)} />
            <InfoRow label="Assigned" value={enq.assigned_to ?? "Unassigned"} />
          </div>

          {enq.selected_plan_name && (
            <div className={cardCls}>
              <p className={sectionTitle}>
                <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
                Selected Plan
              </p>
              <p className="text-sm font-medium text-foreground">{enq.selected_plan_name}</p>
            </div>
          )}

          {enq.ip_address && (
            <div className={cardCls}>
              <p className={sectionTitle}>
                <Globe className="w-3.5 h-3.5 inline mr-1.5" />
                Submission Metadata
              </p>
              <InfoRow label="IP Address" value={enq.ip_address} />
            </div>
          )}
        </div>
      </div>

      {/* Approve modal */}
      {showApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-[#141821] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Approve Enquiry</h3>
            <p className="text-sm text-muted-foreground">
              This will create an onboarding request. Add an optional note.
            </p>
            <textarea
              rows={3}
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Internal approval notes (optional)..."
              className="w-full bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApprove(false)} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={() => approve.mutate()}
                disabled={approve.isPending}
                className="px-4 py-2 rounded-md text-sm font-semibold text-black disabled:opacity-50 transition-opacity"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                {approve.isPending ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-[#141821] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reject Enquiry</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional — recorded as a note)..."
              className="w-full bg-[#0B0B0F] border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReject(false)} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={() => reject.mutate()}
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
