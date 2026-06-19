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
  {
    label: "Master Data",
    href: "/admin/master-data",
    icon: "Database",
    children: [
      { label: "Vessel Library",         href: "/admin/master-data/vessels",              icon: "Ship" },
      { label: "Port Library",           href: "/admin/master-data/ports",                icon: "Anchor" },
      { label: "Weather Conditions",     href: "/admin/master-data/weather",              icon: "Cloud" },
      { label: "Sea States",             href: "/admin/master-data/sea-states",           icon: "Waves" },
      { label: "Visibility Conditions",  href: "/admin/master-data/visibility",           icon: "Eye" },
      { label: "Time Of Day",            href: "/admin/master-data/time-of-day",          icon: "Clock" },
      { label: "Environment Profiles",   href: "/admin/master-data/environment-profiles", icon: "Layers" },
    ],
  },
  {
    label: "Exercise Management",
    href: "/admin/exercises",
    icon: "BookOpen",
    children: [
      { label: "Categories",           href: "/admin/exercises/categories", icon: "BookOpen" },
      { label: "Objectives",           href: "/admin/exercises/objectives", icon: "Target" },
      { label: "Scenarios",            href: "/admin/exercises/scenarios",  icon: "Map" },
      { label: "Exercise Library",     href: "/admin/exercises/library",    icon: "Library" },
      { label: "Variants",             href: "/admin/exercises/variants",   icon: "Layers" },
    ],
  },
  {
    label: "Assessment Management",
    href: "/admin/assessments",
    icon: "ClipboardList",
    children: [
      { label: "Assessments",        href: "/admin/assessments",             icon: "ClipboardList" },
      { label: "Participants",       href: "/admin/assessments",             icon: "UserCheck" },
      { label: "Scheduling",        href: "/admin/assessments",             icon: "CalendarDays" },
      { label: "Progress Dashboard", href: "/admin/assessments",             icon: "BarChart3" },
    ],
  },
  { label: "Maritime Knowledge Base",  href: "/admin/knowledge-base",icon: "Anchor" },
  { label: "AI Management",            href: "/admin/ai-management", icon: "Cpu" },
  { label: "Certificates",             href: "/admin/certificates",  icon: "Award" },
  { label: "Reports & Analytics",      href: "/admin/reports",       icon: "BarChart3" },
  { label: "Audit Logs",               href: "/admin/audit-logs",    icon: "FileText" },
  { label: "Settings",                 href: "/admin/settings",      icon: "Settings" },
];
