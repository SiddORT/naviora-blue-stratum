export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",             href: "/admin/dashboard",      icon: "LayoutDashboard" },
  {
    label: "CRM & Onboarding",
    href: "/admin/crm/enquiries",
    icon: "Inbox",
    children: [
      { label: "Enquiries",              href: "/admin/crm/enquiries",      icon: "MessageSquare" },
      { label: "Registration Requests",  href: "/admin/crm/registrations",  icon: "ClipboardList" },
      { label: "Consent Records",        href: "/admin/crm/consents",       icon: "ShieldCheck" },
    ],
  },
  {
    label: "Organization",
    href: "/admin/organizations",
    icon: "Building2",
    children: [
      { label: "Organizations",  href: "/admin/organizations", icon: "Building2"    },
      { label: "Candidates",     href: "/admin/candidates",    icon: "GraduationCap" },
    ],
  },
  {
    label: "Administration",
    href: "/admin/users",
    icon: "Shield",
    children: [
      { label: "Users",                   href: "/admin/users",                     icon: "Users" },
      { label: "Roles",                   href: "/admin/roles",                     icon: "ShieldCheck" },
      { label: "Permissions",             href: "/admin/permissions",               icon: "Key" },
      { label: "User Invitations",        href: "/admin/invitations",               icon: "Mail" },
      { label: "Organization Assignments", href: "/admin/organization-assignments", icon: "Link" },
      { label: "Access Audit",            href: "/admin/access-audit",              icon: "Activity" },
    ],
  },
  {
    label: "Plans & Licensing",
    href: "/admin/plans",
    icon: "CreditCard",
    children: [
      { label: "Plans",                    href: "/admin/plans",             icon: "CreditCard" },
      { label: "Features",                 href: "/admin/features",          icon: "Puzzle" },
      { label: "Plan Features",            href: "/admin/plan-features",     icon: "ToggleLeft" },
      { label: "Plan Exercises",           href: "/admin/plan-exercises",    icon: "BookOpen" },
      { label: "Organization Subscriptions", href: "/admin/subscriptions",  icon: "Building2" },
      { label: "Usage Dashboard",          href: "/admin/usage",             icon: "BarChart2" },
    ],
  },
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
      { label: "All Assessments", href: "/admin/assessments", icon: "ClipboardList" },
    ],
  },
  { label: "Maritime Knowledge Base",  href: "/admin/knowledge-base",icon: "Anchor" },
  { label: "AI Management",            href: "/admin/ai-management", icon: "Cpu" },
  { label: "Certificates",             href: "/admin/certificates",  icon: "Award" },
  { label: "Reports & Analytics",      href: "/admin/reports",       icon: "BarChart3" },
  { label: "Audit Logs",               href: "/admin/audit-logs",    icon: "FileText" },
  { label: "Settings",                 href: "/admin/settings",      icon: "Settings" },
];
