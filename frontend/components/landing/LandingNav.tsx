"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features",   href: "#features"   },
  { label: "Simulators", href: "#simulators"  },
  { label: "Plans",      href: "#plans"       },
  { label: "Contact",    href: "#contact"     },
];

const LOGIN_OPTIONS = [
  { label: "Admin Login",        href: "/login",           desc: "Platform administration"  },
  { label: "Organization Login", href: "/org/login",       desc: "Organization portal"      },
  { label: "Candidate Login",    href: "/candidate/login", desc: "Candidate assessments"    },
];

export function LandingNav() {
  const [scrolled, setScrolled]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollTo = (href: string) => {
    setMobile(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(11,11,15,0.96)"
          : "linear-gradient(180deg,rgba(11,11,15,0.7) 0%,transparent 100%)",
        borderBottom: scrolled ? "1px solid rgba(212,166,58,0.12)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logos/bluestratum-mark-v2.png"
            alt="Blue Stratum — Naviora"
            width={130}
            height={44}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href)}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-md hover:bg-white/5"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Login dropdown */}
        <div className="hidden md:flex items-center gap-3">
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setLoginOpen((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md border transition-all"
              style={{
                color: "#D4A63A",
                borderColor: "rgba(212,166,58,0.4)",
                background: "rgba(212,166,58,0.07)",
              }}
            >
              Sign In
              <ChevronDown className={`w-4 h-4 transition-transform ${loginOpen ? "rotate-180" : ""}`} />
            </button>

            {loginOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden z-50 shadow-2xl"
                style={{ background: "#141821", borderColor: "rgba(212,166,58,0.2)" }}
              >
                {LOGIN_OPTIONS.map(({ label, href, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setLoginOpen(false)}
                    className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors border-b last:border-b-0"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-sm font-medium text-white">{label}</span>
                    <span className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => scrollTo("#contact")}
            className="px-4 py-2 text-sm font-semibold rounded-md text-black transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
          >
            Request Demo
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setMobile((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-4 space-y-1"
          style={{ background: "#0B0B0F", borderColor: "rgba(212,166,58,0.12)" }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href)}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="pt-3 border-t space-y-1" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {LOGIN_OPTIONS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobile(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-2">
            <button
              onClick={() => scrollTo("#contact")}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-md text-black transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
            >
              Request Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
