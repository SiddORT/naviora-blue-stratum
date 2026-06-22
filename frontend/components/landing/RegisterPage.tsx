"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, Building2, User } from "lucide-react";

type RegisterType = "organization" | "candidate";

interface OrgForm {
  first_name: string; last_name: string; email: string;
  phone: string; company_name: string; country: string; message: string;
}
interface CandForm {
  first_name: string; last_name: string; email: string;
  phone: string; company_name: string; country: string; message: string;
}
interface ConsentState {
  privacy: boolean; marketing: boolean;
}

const ORG_INITIAL: OrgForm   = { first_name: "", last_name: "", email: "", phone: "", company_name: "", country: "", message: "" };
const CAND_INITIAL: CandForm = { first_name: "", last_name: "", email: "", phone: "", company_name: "", country: "", message: "" };

const COUNTRIES = [
  "", "United Kingdom", "United States", "Norway", "Germany", "Singapore",
  "Greece", "Philippines", "India", "United Arab Emirates", "Australia", "Other",
];

const inputCls = "w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 border outline-none transition-all focus:border-opacity-60";
const inputStyle = { background: "#0B0B0F", borderColor: "rgba(255,255,255,0.1)" };

function Checkbox({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0" onClick={onChange}>
        <div
          className="w-4 h-4 rounded flex items-center justify-center border transition-all"
          style={{
            background: checked ? "#D4A63A" : "transparent",
            borderColor: checked ? "#D4A63A" : "rgba(255,255,255,0.25)",
          }}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </label>
  );
}

export function RegisterPage() {
  const params = useSearchParams();
  const defaultType: RegisterType = params.get("type") === "candidate" ? "candidate" : "organization";

  const [type, setType]         = useState<RegisterType>(defaultType);
  const [orgForm, setOrgForm]   = useState<OrgForm>(ORG_INITIAL);
  const [candForm, setCandForm] = useState<CandForm>(CAND_INITIAL);
  const [consent, setConsent]   = useState<ConsentState>({ privacy: false, marketing: false });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const setOrg  = (k: keyof OrgForm)  => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setOrgForm((f)  => ({ ...f, [k]: e.target.value }));
  const setCand = (k: keyof CandForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCandForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent.privacy) { setError("You must agree to the Privacy Policy to continue."); return; }
    setLoading(true); setError(null);

    const consentPayload = {
      privacy_accepted: consent.privacy,
      terms_accepted: consent.privacy,
      data_processing_accepted: consent.privacy,
      marketing_accepted: consent.marketing,
      consent_version: "1.0",
    };

    const endpoint = type === "organization"
      ? "/api/v1/enquiries/register/organization"
      : "/api/v1/enquiries/register/candidate";

    const body = type === "organization"
      ? { ...orgForm,  source_page: "/register", consent: consentPayload }
      : { ...candForm, source_page: "/register", consent: consentPayload };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Submission failed. Please try again.");
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B0B0F" }}>
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded" style={{ background: "linear-gradient(135deg,#D4A63A,#B8860B)" }} />
            <span className="font-bold text-white text-sm">Naviora</span>
            <span className="text-xs" style={{ color: "#64748b" }}>by Blue Stratum</span>
          </Link>
          <Link href="/org/login" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "#94a3b8" }}>
            Already have an account?
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Register with Naviora</h1>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
              Submit your registration request. An administrator will review and contact you within one business day.
            </p>
          </div>

          {/* Type selector */}
          <div
            className="grid grid-cols-2 gap-3 p-1 rounded-xl"
            style={{ background: "#141821", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {(["organization", "candidate"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setError(null); setSuccess(false); }}
                className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all"
                style={type === t
                  ? { background: "linear-gradient(135deg,#D4A63A,#B8860B)", color: "#000" }
                  : { color: "#64748b" }
                }
              >
                {t === "organization" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {t === "organization" ? "Organization" : "Candidate"}
              </button>
            ))}
          </div>

          {success ? (
            <div
              className="rounded-2xl p-10 border flex flex-col items-center text-center gap-4"
              style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <CheckCircle2 className="w-12 h-12" style={{ color: "#D4A63A" }} />
              <h2 className="text-xl font-semibold text-white">Registration Request Received</h2>
              <p className="text-sm max-w-sm" style={{ color: "#64748b" }}>
                Your {type === "organization" ? "organization" : "candidate"} registration has been submitted.
                An administrator will review your request and contact you within one business day.
              </p>
              <button
                onClick={() => { setSuccess(false); setOrgForm(ORG_INITIAL); setCandForm(CAND_INITIAL); setConsent({ privacy: false, marketing: false }); }}
                className="mt-2 text-sm font-medium underline"
                style={{ color: "#D4A63A" }}
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="rounded-2xl p-8 border space-y-4"
              style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {type === "organization" ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>First Name *</label>
                      <input required value={orgForm.first_name} onChange={setOrg("first_name")} placeholder="First name" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Last Name *</label>
                      <input required value={orgForm.last_name} onChange={setOrg("last_name")} placeholder="Last name" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Work Email *</label>
                    <input required type="email" value={orgForm.email} onChange={setOrg("email")} placeholder="name@company.com" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Organization Name *</label>
                    <input required value={orgForm.company_name} onChange={setOrg("company_name")} placeholder="Maritime Academy / Shipping Company" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Phone</label>
                      <input value={orgForm.phone} onChange={setOrg("phone")} placeholder="+44 20 1234 5678" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Country</label>
                      <select value={orgForm.country} onChange={setOrg("country")} className={inputCls} style={{ ...inputStyle, appearance: "none" }}>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c || "Select country..."}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Message</label>
                    <textarea rows={3} value={orgForm.message} onChange={setOrg("message")} placeholder="Tell us about your organization and training requirements..." className={`${inputCls} resize-none`} style={inputStyle} />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>First Name *</label>
                      <input required value={candForm.first_name} onChange={setCand("first_name")} placeholder="First name" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Last Name *</label>
                      <input required value={candForm.last_name} onChange={setCand("last_name")} placeholder="Last name" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Email Address *</label>
                    <input required type="email" value={candForm.email} onChange={setCand("email")} placeholder="name@email.com" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Phone</label>
                      <input value={candForm.phone} onChange={setCand("phone")} placeholder="+44 20 1234 5678" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Country</label>
                      <select value={candForm.country} onChange={setCand("country")} className={inputCls} style={{ ...inputStyle, appearance: "none" }}>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c || "Select country..."}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Current Organization / Employer</label>
                    <input value={candForm.company_name} onChange={setCand("company_name")} placeholder="Shipping company or academy (if applicable)" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Message</label>
                    <textarea rows={3} value={candForm.message} onChange={setCand("message")} placeholder="Tell us about your maritime background and what you are looking for..." className={`${inputCls} resize-none`} style={inputStyle} />
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                  {error}
                </p>
              )}

              {/* Consent */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 shrink-0" onClick={() => setConsent((c) => ({ ...c, privacy: !c.privacy }))}>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center border transition-all"
                      style={{ background: consent.privacy ? "#D4A63A" : "transparent", borderColor: consent.privacy ? "#D4A63A" : "rgba(255,255,255,0.25)" }}
                    >
                      {consent.privacy && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    I have read and agree to the{" "}
                    <a href="/privacy-policy" className="underline hover:text-white" style={{ color: "#D4A63A" }}>Privacy Policy</a>
                    {" "}and consent to Blue Stratum processing my personal data.{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 shrink-0" onClick={() => setConsent((c) => ({ ...c, marketing: !c.marketing }))}>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center border transition-all"
                      style={{ background: consent.marketing ? "#2EA8FF" : "transparent", borderColor: consent.marketing ? "#2EA8FF" : "rgba(255,255,255,0.25)" }}
                    >
                      {consent.marketing && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    I agree to receive product updates and marketing communications. <span style={{ color: "#475569" }}>(Optional)</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !consent.privacy}
                className="w-full py-3 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Submitting..." : type === "organization" ? "Submit Organization Registration" : "Submit Candidate Registration"}
              </button>

              <p className="text-xs text-center" style={{ color: "#334155" }}>
                Your data is processed under GDPR Art. 6(1)(a). Contact{" "}
                <a href="mailto:privacy@bluestratum.com" className="underline hover:text-white">privacy@bluestratum.com</a>
                {" "}to withdraw consent.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
