"use client";

import { Check, Minus } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$199",
    period: "/month",
    description: "For smaller academies getting started with digital assessments.",
    features: [
      { label: "Up to 10 users",              included: true  },
      { label: "50 active candidates",         included: true  },
      { label: "100 assessments/month",        included: true  },
      { label: "2 simulator integrations",     included: true  },
      { label: "Standard reports",             included: true  },
      { label: "AI-assisted reporting",        included: false },
      { label: "Custom exercises",             included: false },
      { label: "SSO / SAML",                  included: false },
      { label: "API access",                   included: false },
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$499",
    period: "/month",
    description: "For established training centers managing larger cohorts.",
    features: [
      { label: "Up to 50 users",              included: true  },
      { label: "Unlimited candidates",         included: true  },
      { label: "Unlimited assessments",        included: true  },
      { label: "10 simulator integrations",    included: true  },
      { label: "Advanced analytics",           included: true  },
      { label: "AI-assisted reporting",        included: true  },
      { label: "Custom exercises",             included: true  },
      { label: "SSO / SAML",                  included: false },
      { label: "API access",                   included: false },
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: " pricing",
    description: "For maritime organizations with advanced compliance and scale requirements.",
    features: [
      { label: "Unlimited users",              included: true  },
      { label: "Unlimited candidates",         included: true  },
      { label: "Unlimited assessments",        included: true  },
      { label: "Unlimited simulator integrations", included: true },
      { label: "Custom analytics & BI",        included: true  },
      { label: "AI-assisted reporting",        included: true  },
      { label: "Custom exercises",             included: true  },
      { label: "SSO / SAML",                  included: true  },
      { label: "API access",                   included: true  },
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export function PlansSection() {
  return (
    <section id="plans" style={{ background: "#141821" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ color: "#2EA8FF", background: "rgba(46,168,255,0.1)", border: "1px solid rgba(46,168,255,0.2)" }}
          >
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Plans for every scale
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Start with what you need. Upgrade as your program grows.
            All plans include a 30-day free trial.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(({ name, price, period, description, features, cta, highlight }) => (
            <div
              key={name}
              className="rounded-2xl p-7 border relative flex flex-col transition-all"
              style={{
                background: highlight ? "#1E2430" : "#0B0B0F",
                borderColor: highlight ? "rgba(212,166,58,0.4)" : "rgba(255,255,255,0.07)",
                boxShadow: highlight ? "0 0 60px rgba(212,166,58,0.08)" : "none",
              }}
            >
              {highlight && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full text-black"
                  style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
                >
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
                  {name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-sm pb-1" style={{ color: "#64748b" }}>{period}</span>
                </div>
                <p className="text-sm" style={{ color: "#64748b" }}>{description}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {features.map(({ label, included }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm">
                    {included ? (
                      <Check className="w-4 h-4 shrink-0" style={{ color: "#D4A63A" }} />
                    ) : (
                      <Minus className="w-4 h-4 shrink-0" style={{ color: "#334155" }} />
                    )}
                    <span style={{ color: included ? "#cbd5e1" : "#475569" }}>{label}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block text-center py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={
                  highlight
                    ? { background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)", color: "#000" }
                    : { border: "1px solid rgba(255,255,255,0.12)", color: "white", background: "rgba(255,255,255,0.04)" }
                }
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#475569" }}>
          All prices in USD. Annual billing available at 20% discount.
          Academic institutions qualify for special pricing.
        </p>
      </div>
    </section>
  );
}
