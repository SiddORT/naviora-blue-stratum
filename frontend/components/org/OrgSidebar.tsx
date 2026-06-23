"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardList,
  BarChart3, CreditCard, Settings, Building2, ChevronLeft, ChevronRight, LogOut, Ship,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { ORG_NAV_ITEMS } from "@/constants/org-navigation";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, GraduationCap, ClipboardList,
  BarChart3, CreditCard, Settings, Building2,
};

export function OrgSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useOrgAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/org/login");
  };

  return (
    <aside
      className="flex flex-col flex-shrink-0 transition-all duration-300 relative z-20"
      style={{
        width: collapsed ? 64 : 240,
        background: "rgba(10,28,32,0.96)",
        borderRight: "1px solid rgba(212,166,58,0.12)",
        minHeight: "100vh",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
           style={{ borderBottom: "1px solid rgba(212,166,58,0.1)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)" }}>
          <Ship className="w-4 h-4 text-black" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold tracking-wide truncate" style={{ color: "#D4A63A" }}>
              {user?.organization_name ?? "Organization"}
            </p>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              {user?.organization_code ?? "Portal"}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {ORG_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group",
                active
                  ? "text-black"
                  : "text-white/50 hover:text-white/80"
              )}
              style={active ? {
                background: "linear-gradient(135deg, #D4A63A, #B8860B)",
                color: "#000",
              } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      {!collapsed && user && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(212,166,58,0.1)" }}>
          <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            {user.user_type.replace("_", " ")}
          </p>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 mx-2 mb-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
        style={{ color: "rgba(255,80,80,0.7)" }}
        title={collapsed ? "Logout" : undefined}
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: "#0A1C1E",
          border: "1px solid rgba(212,166,58,0.25)",
          color: "rgba(212,166,58,0.7)",
        }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
