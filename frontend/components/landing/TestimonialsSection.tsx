const TESTIMONIALS = [
  {
    quote:
      "Naviora transformed how we assess officer competency. What used to take hours of paperwork now happens automatically at the end of every session. Our assessors spend their time assessing — not filing.",
    name: "Capt. Alistair Fenwick",
    role: "Chief Examiner",
    org: "North Atlantic Maritime Academy",
    initial: "A",
    color: "#D4A63A",
  },
  {
    quote:
      "We integrated four Kongsberg simulators in under a week. The data capture is seamless and our flag state auditors were impressed by the traceability of records. Naviora has become essential infrastructure.",
    name: "Dr. Ingrid Solberg",
    role: "Head of Simulation Training",
    org: "Nordic Port Authority Training Division",
    initial: "I",
    color: "#2EA8FF",
  },
  {
    quote:
      "Managing multiple training centres across three countries used to mean three separate systems. With Naviora we have one view of every candidate, every assessment, every certificate. The efficiency gain is significant.",
    name: "Marcus Delacroix",
    role: "Group Training Manager",
    org: "Meridian Shipping Group",
    initial: "M",
    color: "#D4A63A",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" style={{ background: "#141821" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#2EA8FF", background: "rgba(46,168,255,0.1)", border: "1px solid rgba(46,168,255,0.2)" }}
          >
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by maritime professionals
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, org, initial, color }) => (
            <div
              key={name}
              className="rounded-2xl p-7 border flex flex-col"
              style={{ background: "#1E2430", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {/* Quote mark */}
              <div className="text-5xl font-black mb-4 leading-none" style={{ color, opacity: 0.4 }}>"</div>

              <blockquote className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "#94a3b8" }}>
                {quote}
              </blockquote>

              <div className="flex items-center gap-3 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                >
                  {initial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-xs" style={{ color: "#475569" }}>{role}</div>
                  <div className="text-xs" style={{ color: "#475569" }}>{org}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
