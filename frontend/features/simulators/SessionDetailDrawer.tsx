"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";

const statusColors: Record<string, string> = {
  PENDING:   "bg-amber-500/15 text-amber-400",
  RUNNING:   "bg-blue-500/15 text-blue-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  FAILED:    "bg-destructive/15 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

interface Props {
  uuid: string;
  onClose: () => void;
}

function JsonViewer({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  if (!data) {
    return (
      <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground">
        No {label} recorded.
      </div>
    );
  }
  return (
    <pre className="rounded-md bg-muted/40 border border-border p-4 text-xs text-foreground overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function SessionDetailDrawer({ uuid, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["simulator-session", uuid],
    queryFn: () => simulatorsService.getSession(uuid),
  });

  const session = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Session Details</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          ) : !session ? (
            <p className="text-muted-foreground text-sm">Session not found.</p>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm text-primary font-semibold">{session.session_reference}</div>
                  <div className="text-xs text-muted-foreground mt-1">{session.vendor_name ?? "Unknown vendor"}</div>
                </div>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[session.status] ?? "bg-muted text-muted-foreground")}>
                  {session.status}
                </span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Session UUID",  session.uuid],
                  ["Vendor Code",   session.vendor_code ?? "—"],
                  ["Candidate ID",  session.candidate_id ?? "—"],
                  ["Assessment ID", session.assessment_id ?? "—"],
                  ["Exercise ID",   session.exercise_id ?? "—"],
                  ["Started",       session.start_time ? formatDate(session.start_time) : "—"],
                  ["Ended",         session.end_time ? formatDate(session.end_time) : "—"],
                  ["Duration",      session.duration_seconds ? `${session.duration_seconds}s` : "—"],
                  ["Created",       formatDate(session.created_at)],
                  ["Remarks",       session.remarks ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/30 rounded-md px-3 py-2.5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm text-foreground font-mono break-all">{value}</div>
                  </div>
                ))}
              </div>

              {/* Raw payload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Raw Payload</h3>
                <JsonViewer data={session.raw_payload as Record<string, unknown> | null} label="raw payload" />
              </div>

              {/* Processed payload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Processed Payload</h3>
                <JsonViewer data={session.processed_payload as Record<string, unknown> | null} label="processed payload" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
