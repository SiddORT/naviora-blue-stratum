"use client";

import { BarChart3, FileText, TrendingUp } from "lucide-react";

export function OrgReportsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Organization performance and compliance reports
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BarChart3,  title: "Assessment Analytics",     desc: "Pass rates, attempt summaries", soon: true, accent: "#2EA8FF" },
          { icon: FileText,   title: "Competency Reports",       desc: "Individual candidate progress",  soon: true, accent: "#22C55E" },
          { icon: TrendingUp, title: "Organization Performance", desc: "Trend analysis and benchmarks",  soon: true, accent: "#D4A63A" },
        ].map(({ icon: Icon, title, desc, accent }) => (
          <div key={title} className="rounded-xl p-5 flex flex-col gap-3"
               style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                 style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</p>
            </div>
            <span className="self-start px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: "rgba(212,166,58,0.08)", color: "#D4A63A", border: "1px solid rgba(212,166,58,0.15)" }}>
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-8 text-center"
           style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Reporting module launching in a future sprint. Your data is already being collected.
        </p>
      </div>
    </div>
  );
}
