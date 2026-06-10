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
        "relative flex flex-col h-full bg-surface border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* ── Header — PASE Compass brand ──────────────────────────── */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border flex-shrink-0",
        collapsed && "justify-center px-2"
      )}>
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
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer — Blue Stratum parent brand ───────────────────── */}
      <div className={cn(
        "border-t border-border flex-shrink-0",
        collapsed ? "py-3 flex justify-center" : "px-4 py-3"
      )}>
        {collapsed ? (
          /* Collapsed: show the infinity mark only */
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
              style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Powered by
            </p>
            <BlueStratumLogo size="sm" />
          </div>
        )}
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full",
          "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-accent",
          "transition-colors shadow-sm"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
