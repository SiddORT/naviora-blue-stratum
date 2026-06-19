"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, BarChart3, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  assessmentUuid: string;
  assessmentName: string;
  assessmentCode: string;
}

const tabs = [
  { label: "Participants", icon: Users,        suffix: "participants" },
  { label: "Schedule",     icon: CalendarDays, suffix: "schedule"     },
  { label: "Progress",     icon: BarChart3,    suffix: "progress"     },
];

export function AssessmentDetailNav({ assessmentUuid, assessmentName, assessmentCode }: Props) {
  const pathname = usePathname();
  const base = `/admin/assessments/${assessmentUuid}`;

  return (
    <div className="space-y-4">
      {/* Breadcrumb + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/assessments"
          className="mt-0.5 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Back to Assessments"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">
            Assessment Management / {assessmentCode}
          </p>
          <h1 className="text-xl font-bold text-foreground">{assessmentName}</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ label, icon: Icon, suffix }) => {
          const href = `${base}/${suffix}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={suffix}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
