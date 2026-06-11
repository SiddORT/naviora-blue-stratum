"use client";

import { Bell, Search, LogOut, User, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { getInitials } from "@/lib/utils";

export function TopNavbar() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="h-16 flex items-center gap-0 flex-shrink-0 px-0"
      style={{
        background: "rgba(7,27,30,0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(24,178,188,0.14)",
        boxShadow: "0 1px 0 rgba(24,178,188,0.06), 0 4px 24px rgba(0,0,0,0.20)",
      }}
    >

      {/* ── Brand identity ────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 h-full px-5 flex-shrink-0"
        style={{ borderRight: "1px solid rgba(24,178,188,0.12)" }}
      >
        {/* Infinity mark */}
        <Image
          src="/logos/bluestratum-mark-v2.png"
          alt="Naviora"
          width={38}
          height={26}
          className="object-contain flex-shrink-0"
          priority
        />

        {/* Naviora gradient wordmark */}
        <div className="hidden sm:block">
          <span
            className="font-black text-lg leading-none"
            style={{
              background: "linear-gradient(135deg, #F5A623 0%, #FFD580 40%, #18B2BC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            Naviora
          </span>
          <div
            className="text-[9px] font-semibold tracking-[0.22em] uppercase mt-0.5"
            style={{ color: "rgba(24,178,188,0.60)" }}
          >
            by Blue Stratum
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 max-w-sm mx-5">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "rgba(24,178,188,0.55)" }}
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(24,178,188,0.18)",
          }}
          onFocus={e => {
            e.currentTarget.style.border = "1px solid rgba(24,178,188,0.55)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.07)";
          }}
          onBlur={e => {
            e.currentTarget.style.border = "1px solid rgba(24,178,188,0.18)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* ── Right actions ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 ml-auto pr-4">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2.5 rounded-lg transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.45)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#18B2BC";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            (e.currentTarget as HTMLButtonElement).style.background = "";
          }}
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-lg transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.45)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#18B2BC";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            (e.currentTarget as HTMLButtonElement).style.background = "";
          }}
        >
          <Bell className="w-4 h-4" />
          {/* Amber dot — amber from logo */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2"
            style={{
              background: "#F5A623",
              ringColor: "rgba(7,27,30,0.8)",
            }}
          />
        </button>

        {/* Vertical separator */}
        <div className="w-px h-7 mx-1.5" style={{ background: "rgba(24,178,188,0.14)" }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl transition-all duration-150"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.07)";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(24,178,188,0.18)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
            }}
          >
            {/* Avatar — amber gradient matching login CTA button */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-black text-[11px] font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)" }}
            >
              {user ? getInitials(user.full_name) : "SA"}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-[13px] font-semibold leading-tight text-white">
                {user?.full_name ?? "Super Admin"}
              </div>
              <div className="text-[11px] leading-tight" style={{ color: "rgba(24,178,188,0.65)" }}>
                {user?.roles?.[0] ?? "Administrator"}
              </div>
            </div>

            <ChevronDown
              className="w-3 h-3 ml-0.5 transition-transform duration-150"
              style={{
                color: "rgba(255,255,255,0.35)",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(8,24,28,0.96)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: "1px solid rgba(24,178,188,0.18)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-3.5"
                  style={{ borderBottom: "1px solid rgba(24,178,188,0.10)" }}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black text-xs font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)" }}
                    >
                      {user ? getInitials(user.full_name) : "SA"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{user?.full_name}</div>
                      <div className="text-xs truncate" style={{ color: "rgba(24,178,188,0.60)" }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: "rgba(24,178,188,0.12)", color: "#18B2BC" }}
                  >
                    {user?.roles?.[0] ?? "Administrator"}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { icon: User,     label: "Profile" },
                    { icon: Settings, label: "Settings" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all duration-100"
                      style={{ color: "rgba(255,255,255,0.60)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.07)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.60)";
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "rgba(24,178,188,0.65)" }} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div
                  className="py-1.5"
                  style={{ borderTop: "1px solid rgba(24,178,188,0.10)" }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all duration-100"
                    style={{ color: "rgba(252,165,165,0.75)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(252,165,165,0.75)";
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
