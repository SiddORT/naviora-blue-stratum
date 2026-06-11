"use client";

import { Bell, Search, LogOut, User, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { getInitials } from "@/lib/utils";

export function TopNavbar() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = theme === "dark";

  /* ── Theme tokens ─────────────────────────────────────────────── */
  const t = {
    navBg:          isDark ? "rgba(7,27,30,0.75)"           : "rgba(255,255,255,0.92)",
    navBorder:      isDark ? "rgba(24,178,188,0.14)"        : "rgba(0,0,0,0.08)",
    navShadow:      isDark
      ? "0 1px 0 rgba(24,178,188,0.06), 0 4px 24px rgba(0,0,0,0.20)"
      : "0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
    searchBg:       isDark ? "rgba(255,255,255,0.04)"       : "rgba(0,0,0,0.04)",
    searchBorder:   isDark ? "rgba(24,178,188,0.18)"        : "rgba(0,0,0,0.12)",
    searchFocus:    isDark ? "rgba(24,178,188,0.55)"        : "rgba(13,153,166,0.55)",
    searchGlow:     isDark ? "rgba(24,178,188,0.07)"        : "rgba(13,153,166,0.07)",
    searchIcon:     isDark ? "rgba(24,178,188,0.55)"        : "rgba(13,153,166,0.55)",
    searchText:     isDark ? "#ffffff"                       : "#07162A",
    searchPH:       isDark ? "rgba(255,255,255,0.25)"       : "rgba(7,22,42,0.35)",
    iconColor:      isDark ? "rgba(255,255,255,0.45)"       : "rgba(7,22,42,0.55)",
    iconHoverColor: isDark ? "#18B2BC"                      : "#0D99A6",
    iconHoverBg:    isDark ? "rgba(24,178,188,0.08)"        : "rgba(13,153,166,0.08)",
    divider:        isDark ? "rgba(24,178,188,0.14)"        : "rgba(0,0,0,0.08)",
    chipHoverBg:    isDark ? "rgba(24,178,188,0.07)"        : "rgba(13,153,166,0.07)",
    chipHoverBorder:isDark ? "rgba(24,178,188,0.18)"        : "rgba(13,153,166,0.25)",
    userName:       isDark ? "#ffffff"                      : "#07162A",
    userRole:       isDark ? "rgba(24,178,188,0.65)"        : "#0D99A6",
    chevron:        isDark ? "rgba(255,255,255,0.35)"       : "rgba(7,22,42,0.35)",
    dropBg:         isDark ? "rgba(8,24,28,0.96)"           : "rgba(255,255,255,0.98)",
    dropBorder:     isDark ? "rgba(24,178,188,0.18)"        : "rgba(0,0,0,0.10)",
    dropShadow:     isDark ? "0 20px 60px rgba(0,0,0,0.55)": "0 8px 32px rgba(0,0,0,0.12)",
    dropDivider:    isDark ? "rgba(24,178,188,0.10)"        : "rgba(0,0,0,0.07)",
    dropText:       isDark ? "rgba(255,255,255,0.60)"       : "rgba(7,22,42,0.70)",
    dropHoverBg:    isDark ? "rgba(24,178,188,0.07)"        : "rgba(13,153,166,0.07)",
    dropHoverText:  isDark ? "#ffffff"                      : "#07162A",
    dropIcon:       isDark ? "rgba(24,178,188,0.65)"        : "#0D99A6",
    roleBadgeBg:    isDark ? "rgba(24,178,188,0.12)"        : "rgba(13,153,166,0.10)",
    roleBadgeText:  isDark ? "#18B2BC"                      : "#0D99A6",
    signOutText:    isDark ? "rgba(252,165,165,0.75)"       : "rgba(220,38,38,0.75)",
    signOutHoverBg: isDark ? "rgba(239,68,68,0.08)"         : "rgba(220,38,38,0.06)",
    signOutHoverText:isDark? "#FCA5A5"                      : "#DC2626",
    userInfoText:   isDark ? "#ffffff"                      : "#07162A",
    userEmailText:  isDark ? "rgba(24,178,188,0.60)"        : "rgba(7,22,42,0.50)",
  };

  return (
    <header
      className="h-16 flex items-center gap-0 flex-shrink-0 px-0"
      style={{
        background: t.navBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${t.navBorder}`,
        boxShadow: t.navShadow,
      }}
    >

      {/* ── Search ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 max-w-sm mx-5">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: t.searchIcon }}
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none transition-all duration-200"
          style={{
            background: t.searchBg,
            border: `1px solid ${t.searchBorder}`,
            color: t.searchText,
          }}
          onFocus={e => {
            e.currentTarget.style.border = `1px solid ${t.searchFocus}`;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${t.searchGlow}`;
          }}
          onBlur={e => {
            e.currentTarget.style.border = `1px solid ${t.searchBorder}`;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* ── Right actions ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 ml-auto pr-4">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2.5 rounded-lg transition-all duration-150"
          style={{ color: t.iconColor }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = t.iconHoverColor;
            (e.currentTarget as HTMLButtonElement).style.background = t.iconHoverBg;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = t.iconColor;
            (e.currentTarget as HTMLButtonElement).style.background = "";
          }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-lg transition-all duration-150"
          style={{ color: t.iconColor }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = t.iconHoverColor;
            (e.currentTarget as HTMLButtonElement).style.background = t.iconHoverBg;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = t.iconColor;
            (e.currentTarget as HTMLButtonElement).style.background = "";
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#F5A623" }}
          />
        </button>

        {/* Vertical separator */}
        <div className="w-px h-7 mx-1.5" style={{ background: t.divider }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl transition-all duration-150"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = t.chipHoverBg;
              (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${t.chipHoverBorder}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-black text-[11px] font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)" }}
            >
              {user ? getInitials(user.full_name) : "SA"}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-[13px] font-semibold leading-tight" style={{ color: t.userName }}>
                {user?.full_name ?? "Super Admin"}
              </div>
              <div className="text-[11px] leading-tight" style={{ color: t.userRole }}>
                {user?.roles?.[0] ?? "Administrator"}
              </div>
            </div>

            <ChevronDown
              className="w-3 h-3 ml-0.5 transition-transform duration-150"
              style={{
                color: t.chevron,
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
                  background: t.dropBg,
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: `1px solid ${t.dropBorder}`,
                  boxShadow: t.dropShadow,
                }}
              >
                {/* User info */}
                <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${t.dropDivider}` }}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black text-xs font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)" }}
                    >
                      {user ? getInitials(user.full_name) : "SA"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: t.userInfoText }}>
                        {user?.full_name}
                      </div>
                      <div className="text-xs truncate" style={{ color: t.userEmailText }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: t.roleBadgeBg, color: t.roleBadgeText }}
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
                      style={{ color: t.dropText }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = t.dropHoverBg;
                        (e.currentTarget as HTMLButtonElement).style.color = t.dropHoverText;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "";
                        (e.currentTarget as HTMLButtonElement).style.color = t.dropText;
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: t.dropIcon }} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div className="py-1.5" style={{ borderTop: `1px solid ${t.dropDivider}` }}>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all duration-100"
                    style={{ color: t.signOutText }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = t.signOutHoverBg;
                      (e.currentTarget as HTMLButtonElement).style.color = t.signOutHoverText;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "";
                      (e.currentTarget as HTMLButtonElement).style.color = t.signOutText;
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
