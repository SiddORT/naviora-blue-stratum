"use client";

import { Bell, Search, LogOut, User, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
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
      className="h-16 flex items-center gap-4 px-6 flex-shrink-0"
      style={{
        background: "rgba(10, 28, 32, 0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(24,178,188,0.15)",
      }}
    >

      {/* ── Blue Stratum brand mark ──────────────────────────────── */}
      <div className="flex items-center gap-2.5 flex-shrink-0 pr-4"
           style={{ borderRight: "1px solid rgba(24,178,188,0.15)" }}>
        {/* Light mode */}
        <Image
          src="/logos/bluestratum-h-light.png"
          alt="Blue Stratum"
          width={110}
          height={19}
          className="object-contain block dark:hidden"
          priority
        />
        {/* Dark mode */}
        <Image
          src="/logos/bluestratum-h-light.png"
          alt="Blue Stratum"
          width={110}
          height={19}
          className="object-contain hidden dark:block"
          style={{ filter: "brightness(2.5) contrast(0.85)" }}
          priority
        />
      </div>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "rgba(24,178,188,0.6)" }} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(24,178,188,0.20)",
          }}
          onFocus={e => { e.currentTarget.style.border = "1px solid rgba(24,178,188,0.55)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.08)"; }}
          onBlur={e  => { e.currentTarget.style.border = "1px solid rgba(24,178,188,0.20)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {/* ── Right actions ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 ml-auto">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(24,178,188,0.9)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = ""; }}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(24,178,188,0.9)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = ""; }}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#F5A623" }} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)"; (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(24,178,188,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent"; }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)" }}>
              {user ? getInitials(user.full_name) : "SA"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium leading-tight text-white">
                {user?.full_name ?? "Super Admin"}
              </div>
              <div className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>
                {user?.roles?.[0] ?? "Administrator"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl py-1 overflow-hidden"
                   style={{
                     background: "rgba(10,30,35,0.95)",
                     backdropFilter: "blur(24px)",
                     WebkitBackdropFilter: "blur(24px)",
                     border: "1px solid rgba(24,178,188,0.20)",
                     boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                   }}>
                <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(24,178,188,0.12)" }}>
                  <div className="text-sm font-medium text-white">{user?.full_name}</div>
                  <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{user?.email}</div>
                </div>
                {[
                  { icon: User, label: "Profile" },
                  { icon: Settings, label: "Settings" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,178,188,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)"; }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "rgba(24,178,188,0.7)" }} />
                    {label}
                  </button>
                ))}
                <div style={{ borderTop: "1px solid rgba(24,178,188,0.12)" }} className="mt-1 pt-1">
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors"
                    style={{ color: "rgba(252,165,165,0.8)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.10)"; (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "rgba(252,165,165,0.8)"; }}
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
