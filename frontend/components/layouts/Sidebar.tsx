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
import { Logo, BlueStratumLogo } from "@/components/shared/Logo";
import { ADMIN_NAV_ITEMS } from "@/constants/navigation";
import Image from "next/image";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, ShieldCheck, CreditCard,
  Monitor, BookOpen, ClipboardList, Anchor, Cpu, Award,
  BarChart3, FileText, Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "rgba(10, 28, 32, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(24,178,188,0.15)",
      }}
    >
      {/* ── Header — Naviora brand ────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center h-16 px-4 flex-shrink-0",
          collapsed && "justify-center px-2"
        )}
        style={{ borderBottom: "1px solid rgba(24,178,188,0.12)" }}
      >
        {collapsed ? <Logo compact /> : <Logo />}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
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
                background: "rgba(24,178,188,0.12)",
                color: "#18B2BC",
                borderLeft: collapsed ? "none" : "2px solid #18B2BC",
                paddingLeft: collapsed ? undefined : "10px",
              } : {
                color: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(24,178,188,0.07)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)"; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLAnchorElement).style.background = ""; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.5)"; } }}
            >
              <Icon
                className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                     style={{ background: "#18B2BC" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer — Blue Stratum brand ──────────────────────────── */}
      <div
        className={cn(
          "flex-shrink-0",
          collapsed ? "py-3 flex justify-center" : "px-4 py-3"
        )}
        style={{ borderTop: "1px solid rgba(24,178,188,0.12)" }}
      >
        {collapsed ? (
          <div title="Blue Stratum">
            <Image
              src="/logos/bluestratum-h-light.png"
              alt="Blue Stratum"
              width={28}
              height={28}
              className="object-contain block dark:hidden rounded"
            />
            <Image
              src="/logos/bluestratum-h-light.png"
              alt="Blue Stratum"
              width={28}
              height={28}
              className="object-contain hidden dark:block rounded"
              style={{ filter: "brightness(2.5) contrast(0.85)", opacity: 0.7 }}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest font-medium"
               style={{ color: "rgba(255,255,255,0.3)" }}>
              Powered by
            </p>
            <BlueStratumLogo size="sm" />
          </div>
        )}
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-150"
        style={{
          background: "rgba(10,28,32,0.95)",
          border: "1px solid rgba(24,178,188,0.30)",
          color: "rgba(24,178,188,0.7)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
