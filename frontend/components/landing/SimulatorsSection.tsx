const SIMULATORS = [
  {
    name: "Kongsberg Maritime",
    type: "Full-Mission Bridge / ECDIS",
    note: "K-Bridge & K-Sim",
  },
  {
    name: "Wärtsilä / Transas",
    type: "Integrated Navigation System",
    note: "NTPRO series",
  },
  {
    name: "Furuno Electric",
    type: "ECDIS & Radar Systems",
    note: "NavNet TZtouch",
  },
  {
    name: "Raytheon Anschütz",
    type: "Autopilot & Navigation",
    note: "NautoSteer",
  },
  {
    name: "JRC / Alphatron",
    type: "Integrated Bridge System",
    note: "JLR-21 series",
  },
  {
    name: "OSC / Oceanic",
    type: "Engine Room Simulator",
    note: "Full-mission ERS",
  },
  {
    name: "VSTEP Maritime",
    type: "Offshore & Cargo",
    note: "NAUTIS platform",
  },
  {
    name: "Indra Sistemas",
    type: "Port & Maneuvering",
    note: "SHM Simulator",
  },
];

const TYPE_LABELS = [
  { label: "Full-Mission Bridge",  color: "#D4A63A" },
  { label: "ECDIS / Radar",        color: "#2EA8FF" },
  { label: "Engine Room",          color: "#10b981" },
  { label: "Cargo / Offshore",     color: "#a78bfa" },
];

export function SimulatorsSection() {
  return (
    <section id="simulators" style={{ background: "#141821" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#2EA8FF", background: "rgba(46,168,255,0.1)", border: "1px solid rgba(46,168,255,0.2)" }}
          >
            Integrations
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Supported simulators
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#64748b" }}>
            Naviora integrates with the industry-leading maritime simulator vendors.
            Real-time data capture happens automatically during assessment sessions.
          </p>
        </div>

        {/* Simulator grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {SIMULATORS.map(({ name, type, note }) => (
            <div
              key={name}
              className="rounded-xl p-5 border hover:border-opacity-40 transition-all group"
              style={{ background: "#1E2430", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {/* Connector badge */}
              <div
                className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full mb-4"
                style={{ background: "rgba(46,168,255,0.1)", color: "#2EA8FF", border: "1px solid rgba(46,168,255,0.15)" }}
              >
                <span className="w-1 h-1 rounded-full bg-current" />
                Connected
              </div>
              <div className="font-semibold text-white text-sm mb-1">{name}</div>
              <div className="text-xs mb-2" style={{ color: "#64748b" }}>{type}</div>
              <div
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(212,166,58,0.08)", color: "#D4A63A" }}
              >
                {note}
              </div>
            </div>
          ))}
        </div>

        {/* Type legend */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {TYPE_LABELS.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
            </div>
          ))}
          <span className="text-xs" style={{ color: "#475569" }}>
            + open API for custom integrations
          </span>
        </div>
      </div>
    </section>
  );
}
