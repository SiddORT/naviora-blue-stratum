"use client";

import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { ORG_NAV_ITEMS } from "@/constants/org-navigation";

export function OrgTopbar() {
  const pathname = usePathname();
  const { user } = useOrgAuthStore();

  const current = ORG_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{
        background: "rgba(14,20,28,0.96)",
        borderBottom: "1px solid rgba(212,166,58,0.1)",
        height: 64,
      }}
    >
      <div>
        <h1 className="text-base font-semibold text-white">{current?.label ?? "Portal"}</h1>
        {user?.organization_name && (
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {user.organization_name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}>
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,166,58,0.12)" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
               style={{ background: "rgba(212,166,58,0.15)" }}>
            <User className="w-3 h-3" style={{ color: "#D4A63A" }} />
          </div>
          <span className="text-xs font-medium text-white">{user?.full_name ?? "User"}</span>
        </div>
      </div>
    </header>
  );
}
