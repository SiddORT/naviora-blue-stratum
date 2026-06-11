"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ShieldCheck, CreditCard,
  Monitor, BookOpen, ClipboardList, Anchor, Cpu, Award,
  BarChart3, FileText, Settings, ChevronLeft, ChevronRight,
  Server, Sliders, PlayCircle, ScrollText, ChevronDown,
  Database, Ship, Cloud, Waves, Eye, Clock, Layers,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { ADMIN_NAV_ITEMS, type NavItem } from "@/constants/navigation";
import { useThemeStore } from "@/store/theme.store";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, ShieldCheck, CreditCard,
  Monitor, BookOpen, ClipboardList, Anchor, Cpu, Award,
  BarChart3, FileText, Settings,
  Server, Sliders, PlayCircle, ScrollText,
  Database, Ship, Cloud, Waves, Eye, Clock, Layers,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  /* ── Theme tokens ───────────────────────────────────────────── */
  const t = {
    sidebarBg:     isDark ? "rgba(10,28,32,0.88)"           : "rgba(255,255,255,0.92)",
    borderColor:   isDark ? "rgba(24,178,188,0.15)"         : "rgba(0,0,0,0.08)",
    navText:       isDark ? "rgba(255,255,255,0.50)"         : "rgba(7,22,42,0.55)",
    navHoverBg:    isDark ? "rgba(24,178,188,0.07)"          : "rgba(13,153,166,0.07)",
    navHoverText:  isDark ? "rgba(255,255,255,0.85)"         : "rgba(7,22,42,0.90)",
    navActiveBg:   isDark ? "rgba(24,178,188,0.12)"          : "rgba(13,153,166,0.10)",
    navActiveText: isDark ? "#18B2BC"                        : "#0D99A6",
    activeDot:     isDark ? "#18B2BC"                        : "#0D99A6",
    childBg:       isDark ? "rgba(0,0,0,0.15)"              : "rgba(0,0,0,0.02)",
    toggleBg:      isDark ? "rgba(10,28,32,0.95)"           : "rgba(255,255,255,0.95)",
    toggleBorder:  isDark ? "rgba(24,178,188,0.30)"         : "rgba(13,153,166,0.35)",
    toggleText:    isDark ? "rgba(24,178,188,0.70)"         : "#0D99A6",
    footerText:    isDark ? "rgba(255,255,255,0.28)"         : "rgba(7,22,42,0.30)",
  };

  function isActiveHref(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  function isGroupOpen(item: NavItem): boolean {
    // Auto-open if any child is active
    if (item.children?.some((c) => isActiveHref(c.href))) return true;
    return openGroups[item.href] ?? false;
  }

  function NavLink({
    item,
    indent = false,
  }: {
    item: NavItem;
    indent?: boolean;
  }) {
    const Icon = iconMap[item.icon] ?? LayoutDashboard;
    const isActive = isActiveHref(item.href);
    const hasChildren = !!item.children?.length;
    const groupOpen = hasChildren ? isGroupOpen(item) : false;

    if (hasChildren && !collapsed) {
      return (
        <div>
          <button
            onClick={() => toggleGroup(item.href)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            )}
            style={{ color: t.navText }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = t.navHoverBg;
              (e.currentTarget as HTMLButtonElement).style.color = t.navHoverText;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.color = t.navText;
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
              style={{ transform: groupOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {groupOpen && (
            <div
              className="mt-0.5 mb-1 ml-3 pl-3 space-y-0.5 rounded-lg py-1"
              style={{ borderLeft: `1px solid ${t.borderColor}`, background: t.childBg }}
            >
              {item.children!.map((child) => (
                <NavLink key={child.href} item={child} indent />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-2",
          indent && "text-xs py-2",
        )}
        style={isActive ? {
          background: t.navActiveBg,
          color: t.navActiveText,
          borderLeft: (!collapsed && !indent) ? `2px solid ${t.activeDot}` : "none",
          paddingLeft: (!collapsed && !indent) ? "10px" : undefined,
        } : { color: t.navText }}
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
        <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : indent ? "w-3.5 h-3.5" : "w-4 h-4")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {isActive && !collapsed && !indent && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.activeDot }} />
        )}
      </Link>
    );
  }

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
        className={cn("flex items-center h-16 px-4 flex-shrink-0", collapsed && "justify-center px-2")}
        style={{ borderBottom: `1px solid ${t.borderColor}` }}
      >
        {collapsed ? <Logo compact /> : <Logo />}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ borderTop: `1px solid ${t.borderColor}` }}
        >
          <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: t.footerText }}>
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
