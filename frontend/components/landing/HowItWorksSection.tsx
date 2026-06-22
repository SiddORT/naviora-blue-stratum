const STEPS = [
  {
    number: "01",
    title: "Configure exercises and scenarios",
    description:
      "Set up STCW-aligned exercises, competency criteria, and assessment rubrics. Import from existing libraries or build from scratch using the exercise builder.",
  },
  {
    number: "02",
    title: "Assign candidates and schedule sessions",
    description:
      "Add candidates from your organization or upload in bulk. Book simulator time, assign assessors, and send automated reminders.",
  },
  {
    number: "03",
    title: "Conduct live assessments",
    description:
      "Assessors evaluate candidates in real time during simulator sessions. Naviora captures performance data directly from connected simulators.",
  },
  {
    number: "04",
    title: "Generate reports and certificates",
    description:
      "Competency reports are generated automatically at session close. Issue digital certificates, export to PDF, and share with flag states or employers.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ background: "#0B0B0F" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#D4A63A", background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}
          >
            Process
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How Naviora works
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#64748b" }}>
            From exercise creation to certificate issuance — every step is handled
            on one platform.
          </p>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
            style={{ background: "linear-gradient(90deg, rgba(212,166,58,0.3), rgba(46,168,255,0.3))" }}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ number, title, description }, idx) => (
              <div key={number} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Number bubble */}
                <div
                  className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 font-black text-xl"
                  style={{
                    background: idx % 2 === 0 ? "rgba(212,166,58,0.12)" : "rgba(46,168,255,0.12)",
                    border: `2px solid ${idx % 2 === 0 ? "rgba(212,166,58,0.35)" : "rgba(46,168,255,0.35)"}`,
                    color: idx % 2 === 0 ? "#D4A63A" : "#2EA8FF",
                  }}
                >
                  {number}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
