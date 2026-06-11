"use client";

import { useQuery } from "@tanstack/react-query";
import { X, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { simulatorsService } from "@/services/simulators.service";

const statusColors: Record<string, string> = {
  success: "bg-green-500/15 text-green-400",
  error:   "bg-destructive/15 text-destructive",
  timeout: "bg-orange-500/15 text-orange-400",
  pending: "bg-amber-500/15 text-amber-400",
};

function JsonViewer({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  if (!data) {
    return (
      <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground">
        No {label} recorded.
      </div>
    );
  }
  return (
    <pre className="rounded-md bg-muted/40 border border-border p-4 text-xs text-foreground overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

interface Props {
  uuid: string;
  onClose: () => void;
}

export function LogDetailDrawer({ uuid, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["integration-log", uuid],
    queryFn: () => simulatorsService.getLog(uuid),
  });

  const log = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Integration Log Details</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          ) : !log ? (
            <p className="text-muted-foreground text-sm">Log entry not found.</p>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm text-foreground font-semibold">{log.request_type}</div>
                  <div className="text-xs text-muted-foreground mt-1">{log.vendor_name ?? "System"}</div>
                </div>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize", statusColors[log.status] ?? "bg-muted text-muted-foreground")}>
                  {log.status}
                </span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Log UUID",     log.uuid],
                  ["Vendor Code",  log.vendor_code ?? "—"],
                  ["Request URL",  log.request_url ?? "—"],
                  ["Created",      formatDate(log.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/30 rounded-md px-3 py-2.5 col-span-1">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm text-foreground font-mono break-all">{value}</div>
                  </div>
                ))}
              </div>

              {/* Error message */}
              {log.error_message && (
                <div className="flex items-start gap-3 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-destructive mb-1">Error Message</div>
                    <p className="text-sm text-destructive/90">{log.error_message}</p>
                  </div>
                </div>
              )}

              {/* Request payload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Request Payload</h3>
                <JsonViewer data={log.request_payload as Record<string, unknown> | null} label="request payload" />
              </div>

              {/* Response payload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Response Payload</h3>
                <JsonViewer data={log.response_payload as Record<string, unknown> | null} label="response payload" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
