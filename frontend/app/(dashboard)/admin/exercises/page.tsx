import Link from "next/link";
import { BookOpen, Target, Map, Library, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Exercise Management | Naviora" };

const cards = [
  {
    href: "/admin/exercises/categories",
    icon: BookOpen,
    title: "Categories",
    description: "Domain-level groupings for exercises — COLREG, Navigation, Emergency Response, etc.",
  },
  {
    href: "/admin/exercises/objectives",
    icon: Target,
    title: "Competency Objectives",
    description: "Reusable learning objectives mapped to exercises for structured competency tracking.",
  },
  {
    href: "/admin/exercises/scenarios",
    icon: Map,
    title: "Training Scenarios",
    description: "Maritime encounter templates (crossing, head-on, fog, MOB) used as exercise foundations.",
  },
  {
    href: "/admin/exercises/library",
    icon: Library,
    title: "Exercise Library",
    description: "Build and manage graded exercises with versioning, difficulty, and objective mapping.",
  },
  {
    href: "/admin/exercises/variants",
    icon: Layers,
    title: "Variants",
    description: "Simulator-ready variants combining vessels, ports, environment profiles, and duration.",
  },
];

export default function ExercisesIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exercise Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the full exercise hierarchy — from domain categories and competency objectives through to simulator-ready variants.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group relative rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-primary/20 transition-all pointer-events-none" />
          </Link>
        ))}
      </div>
    </div>
  );
}
