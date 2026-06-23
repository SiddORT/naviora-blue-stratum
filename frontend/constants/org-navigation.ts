export interface OrgNavItem {
  label: string;
  href: string;
  icon: string;
  group?: string;
}

export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { label: "Dashboard",            href: "/org/dashboard",             icon: "LayoutDashboard" },
  { label: "Users",                href: "/org/users",                 icon: "Users" },
  { label: "Candidates",           href: "/org/candidates",            icon: "GraduationCap" },
  { label: "Campaigns",            href: "/org/assessment-campaigns",  icon: "Megaphone",    group: "Assessments" },
  { label: "Assignments",          href: "/org/assignments",           icon: "ClipboardCheck", group: "Assessments" },
  { label: "Progress",             href: "/org/progress",              icon: "TrendingUp",   group: "Assessments" },
  { label: "Calendar",             href: "/org/calendar",              icon: "CalendarDays", group: "Assessments" },
  { label: "Sessions",             href: "/org/sessions",              icon: "PlayCircle",   group: "Assessments" },
  { label: "Certificates",         href: "/org/certificates",          icon: "Award" },
  { label: "Reports",              href: "/org/reports",               icon: "BarChart3" },
  { label: "Subscription",         href: "/org/subscription",          icon: "CreditCard" },
  { label: "Settings",             href: "/org/settings",              icon: "Settings" },
  { label: "Profile",              href: "/org/profile",               icon: "Building2" },
];
