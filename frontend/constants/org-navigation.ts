export interface OrgNavItem {
  label: string;
  href: string;
  icon: string;
}

export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { label: "Dashboard",    href: "/org/dashboard",    icon: "LayoutDashboard" },
  { label: "Users",        href: "/org/users",        icon: "Users" },
  { label: "Candidates",   href: "/org/candidates",   icon: "GraduationCap" },
  { label: "Assessments",  href: "/org/assessments",  icon: "ClipboardList" },
  { label: "Reports",      href: "/org/reports",      icon: "BarChart3" },
  { label: "Subscription", href: "/org/subscription", icon: "CreditCard" },
  { label: "Settings",     href: "/org/settings",     icon: "Settings" },
  { label: "Profile",      href: "/org/profile",      icon: "Building2" },
];
