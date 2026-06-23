"use client";

import { ClipboardList, Lock } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";

export function OrgAssessmentsView() {
  const { user } = useOrgAuthStore();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Assessments</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Assessments available under your subscription
        </p>
      </div>

      <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4"
           style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center"
             style={{ background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}>
          <ClipboardList className="w-7 h-7" style={{ color: "#D4A63A" }} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Assessment Access</h2>
          <p className="text-sm max-w-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Assessments entitled to your subscription plan will appear here. Contact your account manager to expand access.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg mt-2"
             style={{ background: "rgba(212,166,58,0.06)", border: "1px solid rgba(212,166,58,0.15)" }}>
          <Lock className="w-3.5 h-3.5" style={{ color: "rgba(212,166,58,0.6)" }} />
          <span className="text-xs" style={{ color: "rgba(212,166,58,0.6)" }}>
            Server-side entitlement validation enforced
          </span>
        </div>
      </div>
    </div>
  );
}
