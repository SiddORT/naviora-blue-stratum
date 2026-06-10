"use client";

import { Bell, Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";

export function TopNavbar() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className={cn(
            "w-full bg-background border border-border rounded-md pl-9 pr-4 py-2",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
            "transition-colors"
          )}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
              {user ? getInitials(user.full_name) : "SA"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-foreground leading-tight">
                {user?.full_name ?? "Super Admin"}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {user?.roles?.[0] ?? "Administrator"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-popover border border-border rounded-lg shadow-xl py-1">
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-sm font-medium text-foreground">{user?.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                </div>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Profile
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings
                </button>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
