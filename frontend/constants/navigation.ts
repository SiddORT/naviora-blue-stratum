export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",             href: "/admin/dashboard",      icon: "LayoutDashboard" },
  { label: "Organizations",         href: "/admin/organizations",  icon: "Building2" },
  { label: "Users",                 href: "/admin/users",          icon: "Users" },
  { label: "Roles & Permissions",   href: "/admin/roles",          icon: "ShieldCheck" },
  { label: "Plans & Subscriptions", href: "/admin/plans",          icon: "CreditCard" },
  {
    label: "Simulator Management",
    href: "/admin/simulator",
    icon: "Monitor",
    children: [
      { label: "Sim Vendors",        href: "/admin/simulator/vendors",        icon: "Server" },
      { label: "Configurations",     href: "/admin/simulator/configurations", icon: "Sliders" },
      { label: "Sessions",           href: "/admin/simulator/sessions",       icon: "PlayCircle" },
      { label: "Integration Logs",   href: "/admin/simulator/logs",           icon: "ScrollText" },
    ],
  },
  { label: "Exercise Management",      href: "/admin/exercises",     icon: "BookOpen" },
  { label: "Assessment Management",    href: "/admin/assessments",   icon: "ClipboardList" },
  { label: "Maritime Knowledge Base",  href: "/admin/knowledge-base",icon: "Anchor" },
  { label: "AI Management",            href: "/admin/ai-management", icon: "Cpu" },
  { label: "Certificates",             href: "/admin/certificates",  icon: "Award" },
  { label: "Reports & Analytics",      href: "/admin/reports",       icon: "BarChart3" },
  { label: "Audit Logs",               href: "/admin/audit-logs",    icon: "FileText" },
  { label: "Settings",                 href: "/admin/settings",      icon: "Settings" },
];
