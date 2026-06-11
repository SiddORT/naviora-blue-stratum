"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ShieldCheck, CreditCard,
  Monitor, BookOpen, ClipboardList, Anchor, Cpu, Award,
  BarChart3, FileText, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { ADMIN_NAV_ITEMS } from "@/constants/navigation";
import { useThemeStore } from "@/store/theme.store";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, ShieldCheck, CreditCard,
  Monitor, BookOpen, ClipboardList, Anchor, Cpu, Award,
  BarChart3, FileText, Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  /* ── Theme tokens ───────────────────────────────────────────── */
  const t = {
    sidebarBg:     isDark ? "rgba(10,28,32,0.88)"             : "rgba(255,255,255,0.92)",
    borderColor:   isDark ? "rgba(24,178,188,0.15)"           : "rgba(0,0,0,0.08)",
    navText:       isDark ? "rgba(255,255,255,0.50)"           : "rgba(7,22,42,0.55)",
    navHoverBg:    isDark ? "rgba(24,178,188,0.07)"            : "rgba(13,153,166,0.07)",
    navHoverText:  isDark ? "rgba(255,255,255,0.85)"           : "rgba(7,22,42,0.90)",
    navActiveBg:   isDark ? "rgba(24,178,188,0.12)"            : "rgba(13,153,166,0.10)",
    navActiveText: isDark ? "#18B2BC"                          : "#0D99A6",
    activeDot:     isDark ? "#18B2BC"                          : "#0D99A6",
    toggleBg:      isDark ? "rgba(10,28,32,0.95)"             : "rgba(255,255,255,0.95)",
    toggleBorder:  isDark ? "rgba(24,178,188,0.30)"           : "rgba(13,153,166,0.35)",
    toggleText:    isDark ? "rgba(24,178,188,0.70)"           : "#0D99A6",
    footerText:    isDark ? "rgba(255,255,255,0.28)"           : "rgba(7,22,42,0.30)",
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: t.sidebarBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: `1px solid ${t.borderColor}`,
      }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center h-16 px-4 flex-shrink-0",
          collapsed && "justify-center px-2"
        )}
        style={{ borderBottom: `1px solid ${t.borderColor}` }}
      >
        {collapsed ? <Logo compact /> : <Logo />}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                collapsed && "justify-center px-2"
              )}
              style={isActive ? {
                background: t.navActiveBg,
                color: t.navActiveText,
                borderLeft: collapsed ? "none" : `2px solid ${t.activeDot}`,
                paddingLeft: collapsed ? undefined : "10px",
              } : {
                color: t.navText,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = t.navHoverBg;
                  (e.currentTarget as HTMLAnchorElement).style.color = t.navHoverText;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "";
                  (e.currentTarget as HTMLAnchorElement).style.color = t.navText;
                }
              }}
            >
              <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: t.activeDot }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ borderTop: `1px solid ${t.borderColor}` }}
        >
          <p
            className="text-[10px] font-medium tracking-widest uppercase"
            style={{ color: t.footerText }}
          >
            Powered by Blue Stratum
          </p>
        </div>
      )}

      {/* ── Collapse toggle ──────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-150"
        style={{
          background: t.toggleBg,
          border: `1px solid ${t.toggleBorder}`,
          color: t.toggleText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
