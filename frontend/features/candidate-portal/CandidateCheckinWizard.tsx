"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService, type CandidateAssignment } from "@/services/candidate.service";
import { CandidatePortalLayout } from "./CandidatePortalLayout";
import { User, FileText, Camera, Monitor, CheckCircle, ArrowLeft, ArrowRight, Shield } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { step: 1, label: "Identity",    icon: User },
  { step: 2, label: "Rules",       icon: FileText },
  { step: 3, label: "Webcam",      icon: Camera },
  { step: 4, label: "Environment", icon: Monitor },
  { step: 5, label: "Ready",       icon: CheckCircle },
] as const;

interface Props { assignmentUuid: string; }

export function CandidateCheckinWizard({ assignmentUuid }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [assignment, setAssignment] = useState<CandidateAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkinComplete, setCheckinComplete] = useState(false);

  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [confirmSelf, setConfirmSelf] = useState(false);
  const [confirmReqs, setConfirmReqs] = useState(false);

  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [ruleNoAssist, setRuleNoAssist] = useState(false);
  const [ruleIntegrity, setRuleIntegrity] = useState(false);
  const [ruleCompliance, setRuleCompliance] = useState(false);

  const [webcamFile, setWebcamFile] = useState<File | null>(null);
  const [webcamPath, setWebcamPath] = useState<string | null>(null);

  const [envInfo, setEnvInfo] = useState({
    browser_name: "",
    browser_version: "",
    operating_system: "",
    device_type: "",
    screen_resolution: "",
    timezone_name: "",
  });

  useEffect(() => {
    const token = candidateService.getToken();
    if (!token) { router.replace("/candidate/login"); return; }
    (async () => {
      try {
        const res = await candidateService.getAssignment(token, assignmentUuid);
        if (res.success && res.data) {
          setAssignment(res.data);
        } else {
          setError("Assignment not found");
        }
        const ua = navigator.userAgent;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res2 = window.screen.width + "x" + window.screen.height;
        setEnvInfo({
          browser_name: getBrowserName(ua),
          browser_version: getBrowserVersion(ua),
          operating_system: getOS(ua),
          device_type: /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop",
          screen_resolution: res2,
          timezone_name: tz,
        });
      } catch {
        setError("Failed to load assignment");
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentUuid, router]);

  function getBrowserName(ua: string) {
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    return "Unknown";
  }
  function getBrowserVersion(ua: string) {
    const m = ua.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
    return m ? m[2] : "";
  }
  function getOS(ua: string) {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";
    return "Unknown";
  }

  useEffect(() => {
    setIdentityConfirmed(confirmSelf && confirmReqs);
  }, [confirmSelf, confirmReqs]);

  useEffect(() => {
    setRulesAccepted(ruleNoAssist && ruleIntegrity && ruleCompliance);
  }, [ruleNoAssist, ruleIntegrity, ruleCompliance]);

  const handleWebcamUpload = async (file: File) => {
    setWebcamFile(file);
    const token = candidateService.getToken();
    if (!token) return;
    try {
      const res = await candidateService.uploadWebcam(token, assignmentUuid, file);
      if (res.success && res.data) {
        setWebcamPath(res.data.webcam_snapshot_path);
      }
    } catch {}
  };

  const handleSubmitCheckin = async () => {
    const token = candidateService.getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await candidateService.submitCheckin(token, assignmentUuid, {
        identity_confirmed: identityConfirmed,
        rules_accepted: rulesAccepted,
        ...envInfo,
      });
      if (res.success) {
        setCheckinComplete(true);
        setStep(5);
        await candidateService.logProctoringEvent(token, assignmentUuid, "Assessment Started");
      } else {
        setError("Check-in failed. Please try again.");
      }
    } catch {
      setError("Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (step === 4) {
      await handleSubmitCheckin();
      return;
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const canNext = () => {
    if (step === 1) return identityConfirmed;
    if (step === 2) return rulesAccepted;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  if (loading) {
    return <CandidatePortalLayout><div style={{ textAlign: "center", padding: "80px 0", color: "#6B7280", fontSize: 14 }}>Loading...</div></CandidatePortalLayout>;
  }

  return (
    <CandidatePortalLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div>
          <button onClick={() => router.push(`/candidate/assessments/${assignmentUuid}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Assessment Check-In</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{assignment?.assessment_name ?? "Assessment"}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "16px 20px", overflowX: "auto" }}>
          {STEPS.map(({ step: s, label, icon: Icon }, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 5 ? "1 0 auto" : "0 0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: step > s ? "#D4A63A20" : step === s ? "#D4A63A" : "#1E2430",
                  border: step === s ? "2px solid #D4A63A" : step > s ? "2px solid #D4A63A40" : "2px solid #2A3441",
                }}>
                  {step > s ? <CheckCircle size={16} color="#D4A63A" /> : <Icon size={16} color={step === s ? "#0B0B0F" : "#4B5563"} />}
                </div>
                <span style={{ fontSize: 10, color: step === s ? "#D4A63A" : step > s ? "#9CA3AF" : "#4B5563", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s ? "#D4A63A30" : "#1E2430", margin: "0 8px", marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>

        {error && <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 10, padding: 14, color: "#EF4444", fontSize: 13 }}>{error}</div>}

        {/* Step 1: Identity */}
        {step === 1 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <User size={20} color="#D4A63A" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Identity Confirmation</h2>
            </div>
            <div style={{ background: "#0B0B0F", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10 }}>Candidate Details</div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Name", candidateService.getUser()?.full_name ?? "—"],
                  ["Assessment", assignment?.assessment_name ?? "—"],
                  ["Campaign", assignment?.campaign_name ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, fontSize: 13 }}>
                    <span style={{ color: "#6B7280", width: 100 }}>{k}</span>
                    <span style={{ color: "#F9FAFB", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                [confirmSelf, setConfirmSelf, "I confirm I am the authorized participant for this assessment"],
                [confirmReqs, setConfirmReqs, "I understand and accept the assessment requirements"],
              ].map(([checked, setter, label]: [boolean, (v: boolean) => void, string], i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 16px", background: "#0B0B0F", borderRadius: 8, border: `1px solid ${checked ? "#D4A63A40" : "#1E2430"}` }}>
                  <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} style={{ marginTop: 2, accentColor: "#D4A63A", width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.5 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Rules */}
        {step === 2 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} color="#D4A63A" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Assessment Rules</h2>
            </div>
            <div style={{ background: "#0B0B0F", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "This assessment must be completed individually without external assistance.",
                "Do not share assessment content, questions, or scenarios with others.",
                "All results are recorded and may be reviewed for academic integrity.",
                "Disconnecting or navigating away may affect your assessment status.",
                "Browser focus events are monitored during the assessment session.",
                "Rules Version: 1.0",
              ].map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4A63A", flexShrink: 0, marginTop: 5 }} />
                  {rule}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                [ruleNoAssist, setRuleNoAssist, "I confirm I will complete this assessment without external assistance"],
                [ruleIntegrity, setRuleIntegrity, "I declare this assessment will reflect my own knowledge and capability"],
                [ruleCompliance, setRuleCompliance, "I agree to comply with all assessment integrity and conduct rules"],
              ].map(([checked, setter, label]: [boolean, (v: boolean) => void, string], i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 16px", background: "#0B0B0F", borderRadius: 8, border: `1px solid ${checked ? "#D4A63A40" : "#1E2430"}` }}>
                  <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} style={{ marginTop: 2, accentColor: "#D4A63A", width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.5 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Webcam */}
        {step === 3 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Camera size={20} color="#D4A63A" />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Webcam Snapshot</h2>
                <span style={{ fontSize: 11, color: "#6B7280", background: "#1E2430", padding: "2px 8px", borderRadius: 10 }}>Optional</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
              If required by your organization, upload a webcam snapshot to confirm your identity before starting the assessment. This step is optional and can be skipped.
            </p>
            {!webcamPath ? (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "36px 24px", border: "2px dashed #2A3441", borderRadius: 10, cursor: "pointer", background: "#0B0B0F" }}>
                <Camera size={32} color="#4B5563" />
                <div style={{ fontSize: 14, color: "#6B7280" }}>Click to upload webcam photo</div>
                <div style={{ fontSize: 12, color: "#374151" }}>JPEG, PNG or WebP</div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleWebcamUpload(f); }} />
              </label>
            ) : (
              <div style={{ background: "#0B0B0F", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle size={20} color="#10B981" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>Snapshot uploaded</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Stored securely for audit purposes</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Environment */}
        {step === 4 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Monitor size={20} color="#D4A63A" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>Environment Validation</h2>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>The following environment information has been detected and will be recorded for audit purposes.</p>
            <div style={{ background: "#0B0B0F", borderRadius: 10, padding: 16, display: "grid", gap: 10 }}>
              {Object.entries(envInfo).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span style={{ color: "#6B7280", width: 140, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                  <span style={{ color: "#F9FAFB", fontFamily: k === "screen_resolution" ? "monospace" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#D4A63A10", border: "1px solid #D4A63A30", borderRadius: 8, padding: 12, display: "flex", gap: 10 }}>
              <Shield size={16} color="#D4A63A" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
                By proceeding, you confirm all information above is accurate. Browser focus events will be monitored during your assessment session.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 5 && (
          <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#10B98120", border: "2px solid #10B98140", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={28} color="#10B981" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 8 }}>Check-In Complete</h2>
            <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 400, margin: "0 auto 24px" }}>
              Your identity has been confirmed and assessment rules accepted. You are now ready to start your assessment.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push(`/candidate/assessments/${assignmentUuid}`)}
                style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#D4A63A", color: "#0B0B0F", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Start Assessment
              </button>
              <button onClick={() => router.push("/candidate/assessments")}
                style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #1E2430", background: "transparent", color: "#6B7280", fontSize: 14, cursor: "pointer" }}>
                Back to Assessments
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setStep((s) => Math.max(s - 1, 1) as Step)} disabled={step === 1}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "1px solid #1E2430", background: "transparent", color: step === 1 ? "#374151" : "#9CA3AF", fontSize: 13, cursor: step === 1 ? "not-allowed" : "pointer" }}>
              <ArrowLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: 12, color: "#4B5563" }}>Step {step} of 4</span>
            <button onClick={goNext} disabled={!canNext() || submitting}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: canNext() ? "#D4A63A" : "#1E2430", color: canNext() ? "#0B0B0F" : "#4B5563", fontSize: 13, fontWeight: 600, cursor: canNext() && !submitting ? "pointer" : "not-allowed" }}>
              {submitting ? "Submitting..." : step === 4 ? "Complete Check-In" : "Next"} {!submitting && <ArrowRight size={14} />}
            </button>
          </div>
        )}
      </div>
    </CandidatePortalLayout>
  );
}
