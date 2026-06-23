"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { candidateService, type CandidateProfile } from "@/services/candidate.service";
import { ClipboardList, PlayCircle, LogOut, User, Menu, X } from "lucide-react";

interface NavLink { label: string; href: string; icon: React.ElementType }
const NAV: NavLink[] = [
  { label: "My Assessments", href: "/candidate/assessments", icon: ClipboardList },
  { label: "My Sessions",    href: "/candidate/sessions",    icon: PlayCircle },
];

export function CandidatePortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    const user = candidateService.getUser();
    if (user) setCandidate(user);
  }, [router]);

  const handleLogout = () => {
    candidateService.clearSession();
    router.push("/candidate/login");
  };

  if (!candidate) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6B7280", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B0F", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <header style={{ background: "#141821", borderBottom: "1px solid #1E2430", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#D4A63A" }}>Naviora</div>
          <div style={{ fontSize: 12, color: "#6B7280", borderLeft: "1px solid #1E2430", paddingLeft: 16 }}>Candidate Portal</div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 4 }} className="hidden-mobile">
          {NAV.map(({ label, href, icon: Icon }) => (
            <a key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none",
              background: pathname === href ? "#D4A63A15" : "transparent",
              color: pathname === href ? "#D4A63A" : "#9CA3AF",
              fontWeight: pathname === href ? 600 : 400,
            }}>
              <Icon size={14} />{label}
            </a>
          ))}
        </nav>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#F9FAFB" }}>{candidate.full_name}</div>
            {candidate.rank_or_designation && <div style={{ fontSize: 11, color: "#6B7280" }}>{candidate.rank_or_designation}</div>}
          </div>
          <button onClick={handleLogout} title="Sign out"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", cursor: "pointer", fontSize: 12 }}>
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Mobile nav bar */}
      <nav style={{ background: "#141821", borderBottom: "1px solid #1E2430", display: "flex", gap: 0 }}>
        {NAV.map(({ label, href, icon: Icon }) => (
          <a key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", fontSize: 11, textDecoration: "none",
            borderBottom: pathname === href ? "2px solid #D4A63A" : "2px solid transparent",
            color: pathname === href ? "#D4A63A" : "#6B7280",
          }}>
            <Icon size={16} />{label}
          </a>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: "24px 20px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}
