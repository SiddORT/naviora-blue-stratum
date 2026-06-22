import {
  ShieldCheck, Users, BookOpen, Award, LineChart, Globe,
  Lock, Layers, Clock, FileCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "STCW-Aligned Exercises",
    description:
      "Build exercises mapped directly to STCW competencies. Ensure every assessment meets international regulatory standards automatically.",
  },
  {
    icon: Users,
    title: "Multi-Organization Management",
    description:
      "Manage multiple maritime academies and training centers from one platform. Complete data isolation with role-based access per organization.",
  },
  {
    icon: ShieldCheck,
    title: "Real-Time Assessment Scoring",
    description:
      "Assessors score candidates live during simulator sessions. Structured evaluation forms with automated competency aggregation.",
  },
  {
    icon: Award,
    title: "Digital Certificates",
    description:
      "Issue tamper-proof digital certificates upon successful assessment. QR-verified certificates with blockchain-backed audit trails.",
  },
  {
    icon: LineChart,
    title: "Analytics & Reporting",
    description:
      "Track cohort performance, identify skill gaps, and generate regulatory reports. Export to PDF or integrate with external HR systems.",
  },
  {
    icon: Globe,
    title: "Offline Mode",
    description:
      "Conduct assessments in remote locations without internet. Data syncs automatically when connectivity is restored.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant. End-to-end encryption, SSO, MFA, and full GDPR data residency controls. Annual penetration testing.",
  },
  {
    icon: FileCheck,
    title: "Audit Logging",
    description:
      "Immutable audit logs for every action on the platform. Full traceability for regulatory inspections and internal reviews.",
  },
  {
    icon: Layers,
    title: "Custom Exercise Libraries",
    description:
      "Import exercises from existing systems or build custom libraries. Version-controlled with approval workflows for quality assurance.",
  },
  {
    icon: Clock,
    title: "Session Scheduling",
    description:
      "Plan and manage simulator booking calendars. Automated reminders, conflict detection, and resource allocation.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" style={{ background: "#0B0B0F" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#D4A63A", background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}
          >
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Built for maritime professionals
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#64748b" }}>
            Every feature designed around the workflows of maritime training
            centers, port authorities, and regulatory bodies.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px"
          style={{ background: "rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 group hover:bg-white/[0.03] transition-colors"
              style={{ background: "#0B0B0F" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "rgba(212,166,58,0.1)" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#D4A63A" }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
