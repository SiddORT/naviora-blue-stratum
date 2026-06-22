import { FileText, ClipboardList, Monitor, BarChart3 } from "lucide-react";

const CARDS = [
  {
    icon: FileText,
    title: "Exercise Creation",
    description:
      "Design scenario-based exercises with STCW-aligned competency frameworks. Import existing exercise libraries or build from scratch.",
    accent: "#D4A63A",
  },
  {
    icon: ClipboardList,
    title: "Assessment Management",
    description:
      "Schedule and conduct real-time assessments with structured evaluation forms, live scoring, and automated competency mapping.",
    accent: "#2EA8FF",
  },
  {
    icon: Monitor,
    title: "Simulator Integration",
    description:
      "Connect to any ECDIS, bridge, engine room, or cargo simulator. Capture live performance data and integrate it into candidate records.",
    accent: "#D4A63A",
  },
  {
    icon: BarChart3,
    title: "Competency Reporting",
    description:
      "Generate detailed competency reports, STCW certificates, and regulatory-compliant documentation from one centralized system.",
    accent: "#2EA8FF",
  },
];

export function PlatformSection() {
  return (
    <section id="platform" style={{ background: "#0B0B0F" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#D4A63A", background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}
          >
            Platform
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything maritime training needs
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#64748b" }}>
            An end-to-end solution for maritime academies, port authorities, and
            shipping companies managing simulator-based assessments at scale.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="rounded-xl p-6 border transition-all hover:border-opacity-60 group"
              style={{
                background: "#141821",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
                style={{ background: `${accent}18` }}
              >
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                {description}
              </p>
              <div
                className="mt-5 h-0.5 w-8 rounded-full transition-all group-hover:w-16"
                style={{ background: accent }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
