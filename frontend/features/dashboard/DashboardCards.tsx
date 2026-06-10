"use client";

import { Building2, Users, ClipboardList, Monitor, Clock, CreditCard, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/common.types";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
}

function buildCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: "Organizations",
      value: stats.total_organizations,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
      description: `${stats.active_organizations} active`,
    },
    {
      label: "Users",
      value: stats.total_users,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      description: `${stats.active_users} active`,
    },
    {
      label: "Assessments",
      value: stats.total_assessments,
      icon: ClipboardList,
      color: "text-success",
      bg: "bg-success/10",
      description: "Total assessments",
    },
    {
      label: "Simulator Sessions",
      value: stats.total_simulator_sessions,
      icon: Monitor,
      color: "text-warning",
      bg: "bg-warning/10",
      description: "Total sessions",
    },
    {
      label: "Pending Enquiries",
      value: stats.pending_enquiries,
      icon: Clock,
      color: "text-destructive",
      bg: "bg-destructive/10",
      description: "Awaiting response",
    },
    {
      label: "Active Plans",
      value: stats.active_plans,
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Live subscriptions",
    },
  ];
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="w-16 h-6 rounded bg-muted" />
      </div>
      <div className="w-24 h-4 rounded bg-muted mb-2" />
      <div className="w-16 h-3 rounded bg-muted" />
    </div>
  );
}

export function DashboardCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await dashboardService.getStats();
      return res.data as DashboardStats;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const stats: DashboardStats = data ?? {
    total_organizations: 0,
    active_organizations: 0,
    total_users: 0,
    active_users: 0,
    total_assessments: 0,
    total_simulator_sessions: 0,
    pending_enquiries: 0,
    active_plans: 0,
  };

  const cards = buildCards(stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.bg)}>
                <Icon className={cn("w-5 h-5", card.color)} />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {card.value.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-foreground mt-1">{card.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.description}</div>
          </div>
        );
      })}
    </div>
  );
}
