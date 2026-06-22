import Link from "next/link";

const LINKS = {
  Platform: [
    { label: "Features",       href: "#features"    },
    { label: "Simulators",     href: "#simulators"  },
    { label: "Plans",          href: "#plans"        },
    { label: "How It Works",   href: "#how-it-works" },
  ],
  Portals: [
    { label: "Admin Login",        href: "/login"            },
    { label: "Organization Login", href: "/org/login"        },
    { label: "Candidate Login",    href: "/candidate/login"  },
    { label: "Register",           href: "/register"         },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy-policy"    },
    { label: "Terms of Service", href: "/terms-of-service"  },
    { label: "Cookie Policy",    href: "/cookie-policy"     },
  ],
};

export function LandingFooter() {
  return (
    <footer style={{ background: "#0B0B0F", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <path d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28" stroke="#2EA8FF" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M16 4C22.627 4 28 9.373 28 16C28 22.627 22.627 28 16 28" stroke="#D4A63A" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="16" cy="16" r="3.5" fill="#D4A63A"/>
                </svg>
              </div>
              <div className="leading-none">
                <div className="text-white font-bold text-lg tracking-tight leading-none">Naviora</div>
                <div className="text-xs tracking-widest uppercase" style={{ color: "#D4A63A", opacity: 0.8, fontSize: "9px" }}>Blue Stratum</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#475569" }}>
              Enterprise maritime assessment, simulator management,
              competency tracking, and certification platform by Blue Stratum.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#D4A63A" }}>
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "#475569" }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs" style={{ color: "#334155" }}>
            &copy; {new Date().getFullYear()} Blue Stratum Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-xs hover:text-white transition-colors" style={{ color: "#334155" }}>Privacy</Link>
            <Link href="/terms-of-service" className="text-xs hover:text-white transition-colors" style={{ color: "#334155" }}>Terms</Link>
            <Link href="/cookie-policy" className="text-xs hover:text-white transition-colors" style={{ color: "#334155" }}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
