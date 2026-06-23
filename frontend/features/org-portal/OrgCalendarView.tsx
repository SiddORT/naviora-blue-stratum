"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { getCalendarEvents } from "@/services/campaign.service";
import type { CalendarEvent, CampaignStatus } from "@/types/campaign.types";

const STATUS_COLORS: Record<CampaignStatus, string> = {
  Draft: "#6B7280", Published: "#2EA8FF", Active: "#22C55E", Completed: "#D4A63A", Archived: "#4B5563",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isEventInDay(event: CalendarEvent, year: number, month: number, day: number): boolean {
  if (!event.start_date) return false;
  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : start;
  const target = new Date(year, month, day);
  return target >= start && target <= end;
}

export function OrgCalendarView() {
  const { accessToken } = useOrgAuthStore();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await getCalendarEvents(accessToken, { year, month: month + 1 });
      setEvents(res.events);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const upcomingEvents = events
    .filter(e => e.start_date)
    .sort((a, b) => (a.start_date ?? "") < (b.start_date ?? "") ? -1 : 1)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Assessment Calendar</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Campaign windows and due dates
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Calendar header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={prevMonth} className="p-1.5 rounded-lg transition-all"
                    style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg transition-all"
                    style={{ color: "#D4A63A", background: "rgba(212,166,58,0.08)" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 px-2 pt-3">
            {DOW.map(d => (
              <div key={d} className="text-center text-[11px] font-medium pb-2"
                   style={{ color: "rgba(255,255,255,0.3)" }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-16" />;
              const dayEvents = events.filter(e => isEventInDay(e, year, month, day));
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              return (
                <div key={day} className="h-16 rounded-lg p-1.5 transition-all"
                     style={{
                       background: isToday ? "rgba(212,166,58,0.08)" : "transparent",
                       border: isToday ? "1px solid rgba(212,166,58,0.2)" : "1px solid transparent",
                     }}>
                  <p className="text-xs font-medium mb-1" style={{ color: isToday ? "#D4A63A" : "rgba(255,255,255,0.5)" }}>
                    {day}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <button key={e.id} onClick={() => router.push(`/org/assessment-campaigns/${e.id}`)}
                              className="w-full text-left truncate text-[10px] px-1 py-0.5 rounded"
                              style={{ background: `${STATUS_COLORS[e.status]}18`, color: STATUS_COLORS[e.status] }}>
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Status</p>
            {(Object.entries(STATUS_COLORS) as Array<[CampaignStatus, string]>).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2 py-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Upcoming */}
          <div className="rounded-xl p-4" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              This Month ({events.length})
            </p>
            {loading ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</p>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-4">
                <CalendarDays className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No campaigns this month</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map(e => (
                  <button key={e.id} onClick={() => router.push(`/org/assessment-campaigns/${e.id}`)}
                          className="w-full text-left p-3 rounded-xl transition-all"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-white truncate flex-1">{e.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${STATUS_COLORS[e.status]}18`, color: STATUS_COLORS[e.status] }}>
                        {e.status}
                      </span>
                    </div>
                    {e.start_date && (
                      <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {new Date(e.start_date).toLocaleDateString()} {e.end_date ? `→ ${new Date(e.end_date).toLocaleDateString()}` : ""}
                      </p>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {e.assignment_count} candidate{e.assignment_count !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
