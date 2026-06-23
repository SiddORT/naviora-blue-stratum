"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, Info, Search,
  Clock, Target, RotateCcw, Shuffle,
} from "lucide-react";
import { useOrgAuthStore } from "@/store/org-auth.store";
import {
  createCampaign,
  getActiveAssessments,
} from "@/services/campaign.service";
import { listOrgCandidates } from "@/services/org-portal.service";
import type { ActiveAssessmentOption } from "@/types/campaign.types";
import type { OrgCandidateListItem } from "@/types/org-portal.types";

const STEPS = [
  "Campaign Info",
  "Assessment",
  "Candidates",
  "Schedule",
  "Options",
  "Review",
];

interface FormState {
  campaign_name: string;
  description: string;
  assessment_id: number | null;
  candidate_ids: number[];
  start_date: string;
  end_date: string;
  timezone: string;
  duration_override_minutes: string;
  passing_score_override: string;
  max_attempts_override: string;
  randomize_exercises: boolean;
  randomize_variants: boolean;
}

const INITIAL: FormState = {
  campaign_name: "",
  description: "",
  assessment_id: null,
  candidate_ids: [],
  start_date: "",
  end_date: "",
  timezone: "UTC",
  duration_override_minutes: "",
  passing_score_override: "",
  max_attempts_override: "",
  randomize_exercises: false,
  randomize_variants: false,
};

export function OrgCampaignCreateView() {
  const { accessToken } = useOrgAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [assessments, setAssessments] = useState<ActiveAssessmentOption[]>([]);
  const [candidates, setCandidates] = useState<OrgCandidateListItem[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!accessToken) return;
    getActiveAssessments(accessToken).then(setAssessments).catch(() => {});
    listOrgCandidates(accessToken, { page: 1, page_size: 200 })
      .then(r => setCandidates(r.items))
      .catch(() => {});
  }, [accessToken]);

  const filteredCandidates = candidates.filter(c =>
    !candidateSearch ||
    c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const selectedAssessment = assessments.find(a => a.id === form.assessment_id) ?? null;

  const toggleCandidate = (id: number) => {
    set("candidate_ids",
      form.candidate_ids.includes(id)
        ? form.candidate_ids.filter(x => x !== id)
        : [...form.candidate_ids, id]
    );
  };

  const toggleAllCandidates = () => {
    const allIds = filteredCandidates.map(c => c.id);
    const allSelected = allIds.every(id => form.candidate_ids.includes(id));
    if (allSelected) {
      set("candidate_ids", form.candidate_ids.filter(id => !allIds.includes(id)));
    } else {
      set("candidate_ids", [...new Set([...form.candidate_ids, ...allIds])]);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.campaign_name.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        campaign_name: form.campaign_name,
        description: form.description || undefined,
        assessment_id: form.assessment_id ?? undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        timezone: form.timezone,
        duration_override_minutes: form.duration_override_minutes ? Number(form.duration_override_minutes) : undefined,
        passing_score_override: form.passing_score_override ? Number(form.passing_score_override) : undefined,
        max_attempts_override: form.max_attempts_override ? Number(form.max_attempts_override) : undefined,
        randomize_exercises: form.randomize_exercises,
        randomize_variants: form.randomize_variants,
      };
      const campaign = await createCampaign(accessToken, payload);
      router.push(`/org/assessment-campaigns/${campaign.uuid}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create campaign");
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelClass = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "rgba(255,255,255,0.5)" };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Create Campaign</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Set up an assessment campaign for your candidates
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-0 flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                   style={{
                     background: i < step ? "#22C55E" : i === step ? "linear-gradient(135deg,#D4A63A,#B8860B)" : "rgba(255,255,255,0.08)",
                     color: i <= step ? "#000" : "rgba(255,255,255,0.3)",
                   }}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <p className="text-[10px] mt-1 whitespace-nowrap" style={{ color: i === step ? "#D4A63A" : "rgba(255,255,255,0.3)" }}>
                {s}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mb-4 mx-2" style={{ background: i < step ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl p-6" style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.06)" }}>
        {error && (
          <div className="mb-5 px-3 py-2 rounded-lg text-xs text-red-400 flex items-center gap-2"
               style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 0 — Campaign Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Campaign Information</h2>
            <div>
              <label className={labelClass} style={labelStyle}>Campaign Name *</label>
              <input className={inputClass} style={inputStyle} placeholder="e.g. July 2026 COLREG Assessment"
                     value={form.campaign_name} onChange={e => set("campaign_name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Description</label>
              <textarea className={inputClass} style={inputStyle} rows={3}
                        placeholder="Optional description of this campaign..."
                        value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 1 — Assessment */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Select Assessment</h2>
            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  No active assessments available. Create one in the admin panel first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assessments.map(a => (
                  <button key={a.uuid} onClick={() => set("assessment_id", form.assessment_id === a.id ? null : a.id)}
                          className="w-full text-left p-4 rounded-xl transition-all"
                          style={{
                            background: form.assessment_id === a.id ? "rgba(212,166,58,0.08)" : "rgba(255,255,255,0.03)",
                            border: form.assessment_id === a.id ? "1px solid rgba(212,166,58,0.3)" : "1px solid rgba(255,255,255,0.07)",
                          }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{a.assessment_name}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{a.assessment_code}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{a.assessment_type}</p>
                      </div>
                      <div className="text-right space-y-1 flex-shrink-0 ml-4">
                        {a.exercise_count > 0 && (
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{a.exercise_count} exercises</p>
                        )}
                        {a.duration_minutes && (
                          <p className="text-xs flex items-center gap-1 justify-end" style={{ color: "rgba(255,255,255,0.5)" }}>
                            <Clock className="w-3 h-3" />{a.duration_minutes} min
                          </p>
                        )}
                        {a.passing_score && (
                          <p className="text-xs flex items-center gap-1 justify-end" style={{ color: "rgba(255,255,255,0.5)" }}>
                            <Target className="w-3 h-3" />{a.passing_score}% pass
                          </p>
                        )}
                      </div>
                    </div>
                    {form.assessment_id === a.id && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "#D4A63A" }}>
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Candidates */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Select Candidates</h2>
              <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "rgba(212,166,58,0.1)", color: "#D4A63A" }}>
                {form.candidate_ids.length} selected
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input className={inputClass + " pl-10"} style={inputStyle} placeholder="Search candidates..."
                     value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} />
            </div>
            {filteredCandidates.length > 0 && (
              <button onClick={toggleAllCandidates}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(46,168,255,0.08)", color: "#2EA8FF" }}>
                {filteredCandidates.every(c => form.candidate_ids.includes(c.id)) ? "Deselect All" : "Select All"} ({filteredCandidates.length})
              </button>
            )}
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {candidates.length === 0 ? "No candidates in this organization" : "No candidates match your search"}
                </p>
              ) : filteredCandidates.map(c => {
                const selected = form.candidate_ids.includes(c.id);
                return (
                  <button key={c.uuid} onClick={() => toggleCandidate(c.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                          style={{
                            background: selected ? "rgba(212,166,58,0.07)" : "rgba(255,255,255,0.03)",
                            border: selected ? "1px solid rgba(212,166,58,0.2)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all`}
                         style={{
                           background: selected ? "linear-gradient(135deg,#D4A63A,#B8860B)" : "rgba(255,255,255,0.08)",
                           border: selected ? "none" : "1px solid rgba(255,255,255,0.15)",
                         }}>
                      {selected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{c.email}</p>
                    </div>
                    {c.rank_or_designation && (
                      <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {c.rank_or_designation}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              You can assign more candidates after the campaign is published.
            </p>
          </div>
        )}

        {/* Step 3 — Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Schedule</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>Start Date</label>
                <input type="date" className={inputClass} style={inputStyle}
                       value={form.start_date} onChange={e => set("start_date", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>End Date</label>
                <input type="date" className={inputClass} style={inputStyle}
                       value={form.end_date} onChange={e => set("end_date", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Timezone</label>
              <select className={inputClass} style={inputStyle}
                      value={form.timezone} onChange={e => set("timezone", e.target.value)}>
                {["UTC", "Asia/Manila", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles"].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="pt-2 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                Optional Overrides
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Duration (min)", key: "duration_override_minutes", placeholder: "e.g. 90" },
                  { label: "Passing Score (%)", key: "passing_score_override", placeholder: "e.g. 70" },
                  { label: "Max Attempts", key: "max_attempts_override", placeholder: "e.g. 3" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className={labelClass} style={labelStyle}>{label}</label>
                    <input type="number" className={inputClass} style={inputStyle} placeholder={placeholder}
                           value={form[key as keyof FormState] as string}
                           onChange={e => set(key as keyof FormState, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Options */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Assessment Options</h2>
            {[
              { key: "randomize_exercises", label: "Randomize Exercise Order", icon: Shuffle,
                desc: "Exercises will be presented in random order for each candidate." },
              { key: "randomize_variants", label: "Randomize Variant Selection", icon: RotateCcw,
                desc: "Scenario variants within each exercise will be randomly selected." },
            ].map(({ key, label, icon: Icon, desc }) => (
              <button key={key} onClick={() => set(key as keyof FormState, !form[key as keyof FormState])}
                      className="w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left"
                      style={{
                        background: form[key as keyof FormState] ? "rgba(212,166,58,0.07)" : "rgba(255,255,255,0.03)",
                        border: form[key as keyof FormState] ? "1px solid rgba(212,166,58,0.25)" : "1px solid rgba(255,255,255,0.07)",
                      }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: form[key as keyof FormState] ? "rgba(212,166,58,0.15)" : "rgba(255,255,255,0.06)" }}>
                  <Icon className="w-4 h-4" style={{ color: form[key as keyof FormState] ? "#D4A63A" : "rgba(255,255,255,0.35)" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <div className={`w-9 h-5 rounded-full relative transition-all`}
                         style={{ background: form[key as keyof FormState] ? "#D4A63A" : "rgba(255,255,255,0.1)" }}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all`}
                           style={{ left: form[key as keyof FormState] ? "calc(100% - 1.125rem)" : "0.125rem" }} />
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-4">Review & Create</h2>
            <div className="space-y-3">
              {[
                { label: "Campaign Name", value: form.campaign_name },
                { label: "Description", value: form.description || "None" },
                { label: "Assessment", value: selectedAssessment?.assessment_name ?? "Not selected" },
                { label: "Candidates", value: `${form.candidate_ids.length} selected` },
                { label: "Schedule", value: form.start_date ? `${form.start_date} to ${form.end_date || "open"}` : "No schedule" },
                { label: "Timezone", value: form.timezone },
                { label: "Randomize Exercises", value: form.randomize_exercises ? "Yes" : "No" },
                { label: "Randomize Variants", value: form.randomize_variants ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2"
                     style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 px-4 py-3 rounded-lg" style={{ background: "rgba(46,168,255,0.06)", border: "1px solid rgba(46,168,255,0.15)" }}>
              <p className="text-xs" style={{ color: "rgba(46,168,255,0.8)" }}>
                The campaign will be created as a Draft. You can then publish it and assign candidates.
                Candidates selected here will need to be assigned after publishing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !form.campaign_name}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }}>
            {submitting ? "Creating..." : "Create Campaign"}
          </button>
        )}
      </div>
    </div>
  );
}
