import type { Metadata } from "next";
import { ClipboardList, Tag, ScrollText, Eye } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Assessment Management" };

const cards = [
  { href: "/admin/assessments/categories", icon: Tag, label: "Assessment Categories", description: "Organise assessments into logical domains." },
  { href: "/admin/assessments/templates", icon: ClipboardList, label: "Assessment Templates", description: "Build reusable assessment definitions with exercises and rules." },
  { href: "/admin/assessments/rules", icon: ScrollText, label: "Assessment Rules", description: "Configure pass criteria, attempts, and variant selection behaviour." },
];

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Build and manage reusable maritime assessment templates.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, icon: Icon, label, description }) => (
          <Link key={href} href={href} className="border border-border rounded-xl bg-card p-5 hover:border-primary/50 hover:bg-card/80 transition-all group space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
