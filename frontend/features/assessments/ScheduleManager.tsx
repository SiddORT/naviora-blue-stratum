"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle, CalendarDays, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { assessmentService } from "@/services/assessments.service";
import { AssessmentDetailNav } from "./AssessmentDetailNav";
import type { AssessmentScheduleUpsertPayload, ScheduleType, ScheduleStatus } from "@/types/assessment.types";
import { SCHEDULE_TYPES, SCHEDULE_STATUSES } from "@/types/assessment.types";

interface Props {
  assessmentUuid: string;
}

const fieldLabel = "block text-xs font-medium text-muted-foreground mb-1.5";
const fieldInput = cn(
  "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground w-full",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
);

function toLocalInput(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOString(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export function ScheduleManager({ assessmentUuid }: Props) {
  const qc = useQueryClient();

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ["assessment", assessmentUuid],
    queryFn: () => assessmentService.get(assessmentUuid).then(r => r.data),
  });

  const { data: existingSchedule, isLoading: loadingSchedule, refetch } = useQuery({
    queryKey: ["assessment-schedule", assessmentUuid],
    queryFn: () => assessmentService.getSchedule(assessmentUuid).then(r => r.data),
    enabled: !!assessment,
  });

  // Form state
  const [scheduleType, setScheduleType] = useState<ScheduleType>("Always Open");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [durationOverride, setDurationOverride] = useState("");
  const [allowLateStart, setAllowLateStart] = useState(false);
  const [gracePeriod, setGracePeriod] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("Draft");
  const [isOpen, setIsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Populate form when schedule loads
  useEffect(() => {
    if (existingSchedule) {
      setScheduleType(existingSchedule.schedule_type as ScheduleType);
      setStartDate(toLocalInput(existingSchedule.start_date));
      setEndDate(toLocalInput(existingSchedule.end_date));
      setTimezone(existingSchedule.timezone);
      setDurationOverride(existingSchedule.duration_override?.toString() ?? "");
      setAllowLateStart(existingSchedule.allow_late_start);
      setGracePeriod(existingSchedule.grace_period_minutes?.toString() ?? "");
      setScheduleStatus(existingSchedule.schedule_status as ScheduleStatus);
      setIsOpen(existingSchedule.is_open);
      setDirty(false);
    }
  }, [existingSchedule]);

  const saveMutation = useMutation({
    mutationFn: (payload: AssessmentScheduleUpsertPayload) =>
      assessmentService.upsertSchedule(assessmentUuid, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-schedule", assessmentUuid] });
      toast({ variant: "success", title: "Schedule saved" });
      setDirty(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  function handleSave() {
    if (scheduleType === "Scheduled Window" && startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        toast({ variant: "destructive", title: "End date must be after start date" });
        return;
      }
    }
    const payload: AssessmentScheduleUpsertPayload = {
      schedule_type: scheduleType,
      start_date: scheduleType === "Scheduled Window" ? toISOString(startDate) : null,
      end_date: scheduleType === "Scheduled Window" ? toISOString(endDate) : null,
      timezone,
      duration_override: durationOverride ? parseInt(durationOverride, 10) : null,
      allow_late_start: allowLateStart,
      grace_period_minutes: gracePeriod ? parseInt(gracePeriod, 10) : null,
      schedule_status: scheduleStatus,
      is_open: isOpen,
    };
    saveMutation.mutate(payload);
  }

  function mark() { setDirty(true); }

  if (loadingAssessment) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading assessment...</div>;
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-destructive text-sm">
        <AlertCircle className="w-4 h-4" /> Assessment not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssessmentDetailNav
        assessmentUuid={assessmentUuid}
        assessmentName={assessment.assessment_name}
        assessmentCode={assessment.assessment_code}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Schedule Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {existingSchedule ? "Edit the existing schedule" : "No schedule configured yet — define one below"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity",
              dirty ? "gradient-gold text-black hover:opacity-90" : "bg-muted text-muted-foreground",
              saveMutation.isPending && "opacity-60 cursor-not-allowed",
            )}
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : existingSchedule ? "Save Changes" : "Create Schedule"}
          </button>
        </div>
      </div>

      {loadingSchedule ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading schedule...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Schedule Window</h3>
            </div>

            <div>
              <label className={fieldLabel}>Schedule Type</label>
              <select
                value={scheduleType}
                onChange={e => { setScheduleType(e.target.value as ScheduleType); mark(); }}
                className={fieldInput}
              >
                {SCHEDULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {scheduleType === "Always Open"
                  ? "Participants can start the assessment at any time."
                  : "Participants can only access within the defined window."}
              </p>
            </div>

            {scheduleType === "Scheduled Window" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabel}>Start Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => { setStartDate(e.target.value); mark(); }}
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>End Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={e => { setEndDate(e.target.value); mark(); }}
                      className={fieldInput}
                    />
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>Timezone</label>
                  <input
                    type="text"
                    placeholder="e.g. UTC, Asia/Kolkata"
                    value={timezone}
                    onChange={e => { setTimezone(e.target.value); mark(); }}
                    className={fieldInput}
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <input
                id="is_open"
                type="checkbox"
                checked={isOpen}
                onChange={e => { setIsOpen(e.target.checked); mark(); }}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="is_open" className="text-sm text-foreground cursor-pointer">
                Assessment is currently open for participants
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Timing &amp; Status</h3>
            </div>

            <div>
              <label className={fieldLabel}>Duration Override (minutes)</label>
              <input
                type="number"
                min={1}
                placeholder="Inherit from assessment"
                value={durationOverride}
                onChange={e => { setDurationOverride(e.target.value); mark(); }}
                className={fieldInput}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Overrides the assessment default duration for this schedule.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border mb-3">
                <input
                  id="allow_late"
                  type="checkbox"
                  checked={allowLateStart}
                  onChange={e => { setAllowLateStart(e.target.checked); mark(); }}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="allow_late" className="text-sm text-foreground cursor-pointer">
                  Allow late start after window opens
                </label>
              </div>
              {allowLateStart && (
                <div>
                  <label className={fieldLabel}>Grace Period (minutes)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 15"
                    value={gracePeriod}
                    onChange={e => { setGracePeriod(e.target.value); mark(); }}
                    className={fieldInput}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={fieldLabel}>Schedule Status</label>
              <select
                value={scheduleStatus}
                onChange={e => { setScheduleStatus(e.target.value as ScheduleStatus); mark(); }}
                className={fieldInput}
              >
                {SCHEDULE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {existingSchedule && (
              <div className="pt-2 border-t border-border space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(existingSchedule.created_at).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(existingSchedule.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
