"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sea-wave-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* Dark overlay — layered for depth */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: "linear-gradient(160deg, rgba(11,11,15,0.88) 0%, rgba(20,24,33,0.78) 45%, rgba(11,11,15,0.92) 100%)",
        }}
      />

      {/* Gold ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{
          zIndex: 2,
          background: "radial-gradient(ellipse, rgba(212,166,58,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Blue glow bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          zIndex: 2,
          background: "radial-gradient(ellipse at bottom right, rgba(46,168,255,0.07) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative text-center px-6 max-w-5xl mx-auto" style={{ zIndex: 3 }}>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-8"
          style={{ borderColor: "rgba(212,166,58,0.3)", background: "rgba(212,166,58,0.07)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D4A63A" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#D4A63A" }}>
            Maritime Training Platform
          </span>
        </div>

        {/* Wordmark */}
        <div className="mb-3">
          <span
            className="text-7xl md:text-9xl font-black tracking-tight leading-none"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Naviora
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-xl md:text-3xl font-semibold text-white mb-4 leading-snug">
          Maritime Assessment &{" "}
          <span style={{ color: "#2EA8FF" }}>Simulator Management</span> Platform
        </h1>

        {/* Sub-headline */}
        <p className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
          Create exercises, conduct assessments, integrate simulators and generate
          competency reports from one unified platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => scrollTo("#contact")}
            className="px-8 py-3.5 text-sm font-bold rounded-lg text-black transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg min-w-40"
            style={{
              background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)",
              boxShadow: "0 8px 32px rgba(212,166,58,0.3)",
            }}
          >
            Request Demo
          </button>
          <button
            onClick={() => scrollTo("#plans")}
            className="px-8 py-3.5 text-sm font-bold rounded-lg border transition-all hover:bg-white/5 hover:scale-[1.02] min-w-40"
            style={{
              color: "#2EA8FF",
              borderColor: "rgba(46,168,255,0.4)",
              background: "rgba(46,168,255,0.07)",
            }}
          >
            View Plans
          </button>
        </div>

        {/* Stats strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            { value: "40+", label: "Simulator Integrations" },
            { value: "12K+", label: "Assessments Conducted" },
            { value: "98%",  label: "Certification Pass Rate" },
            { value: "150+", label: "Organizations Worldwide" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold" style={{ color: "#D4A63A" }}>{value}</div>
              <div className="text-xs mt-1 uppercase tracking-wider" style={{ color: "#64748b" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollTo("#platform")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 hover:opacity-80 transition-opacity"
        style={{ zIndex: 3 }}
        aria-label="Scroll to platform overview"
      >
        <span className="text-xs uppercase tracking-widest text-slate-400">Scroll</span>
        <ChevronDown className="w-5 h-5 text-slate-400 animate-bounce" />
      </button>
    </section>
  );
}
