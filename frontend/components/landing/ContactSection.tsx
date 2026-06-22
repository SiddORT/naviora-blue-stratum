"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Mail, Building2, MessageSquare, User } from "lucide-react";

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  organization: string;
  role: string;
  message: string;
}

const INITIAL: FormState = {
  first_name: "", last_name: "", email: "",
  organization: "", role: "", message: "",
};

export function ContactSection() {
  const [form, setForm]       = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed. Please try again.");
      setSuccess(true);
      setForm(INITIAL);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 border outline-none transition-all focus:border-opacity-60";
  const inputStyle = {
    background: "#0B0B0F",
    borderColor: "rgba(255,255,255,0.1)",
  };

  return (
    <section id="contact" style={{ background: "#0B0B0F" }} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — copy */}
          <div>
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ color: "#D4A63A", background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}
            >
              Contact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Request a demo
            </h2>
            <p className="text-lg mb-8" style={{ color: "#64748b" }}>
              Tell us about your organization and we will arrange a personalized walkthrough
              of the platform. Typical response time is within one business day.
            </p>

            <div className="space-y-5">
              {[
                { icon: User,           text: "Dedicated onboarding specialist" },
                { icon: Building2,      text: "Custom setup for your organization" },
                { icon: Mail,           text: "White-glove migration from existing systems" },
                { icon: MessageSquare,  text: "30-day risk-free trial included" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(212,166,58,0.1)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#D4A63A" }} />
                  </div>
                  <span className="text-sm" style={{ color: "#94a3b8" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div
            className="rounded-2xl p-8 border"
            style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}
          >
            {success ? (
              <div className="flex flex-col items-center text-center py-12 gap-4">
                <CheckCircle2 className="w-12 h-12" style={{ color: "#D4A63A" }} />
                <h3 className="text-xl font-semibold text-white">Request received</h3>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Our team will be in touch within one business day to arrange your demo.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-4 text-sm font-medium underline"
                  style={{ color: "#D4A63A" }}
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>First Name *</label>
                    <input
                      required value={form.first_name} onChange={set("first_name")}
                      placeholder="James" className={inputClass} style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Last Name *</label>
                    <input
                      required value={form.last_name} onChange={set("last_name")}
                      placeholder="Hawkins" className={inputClass} style={inputStyle}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Work Email *</label>
                  <input
                    required type="email" value={form.email} onChange={set("email")}
                    placeholder="james.hawkins@academy.com" className={inputClass} style={inputStyle}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Organization *</label>
                  <input
                    required value={form.organization} onChange={set("organization")}
                    placeholder="Maritime Academy / Shipping Company" className={inputClass} style={inputStyle}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Your Role</label>
                  <select
                    value={form.role} onChange={set("role")}
                    className={inputClass}
                    style={{ ...inputStyle, appearance: "none" }}
                  >
                    <option value="">Select your role...</option>
                    <option value="Training Manager">Training Manager</option>
                    <option value="Chief Examiner">Chief Examiner / Assessor</option>
                    <option value="IT / Systems">IT / Systems Administrator</option>
                    <option value="Executive">Executive / Director</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>Message</label>
                  <textarea
                    rows={4} value={form.message} onChange={set("message")}
                    placeholder="Tell us about your current assessment process, simulator setup, and what you're looking to improve..."
                    className={`${inputClass} resize-none`} style={inputStyle}
                  />
                </div>

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending..." : "Request Demo"}
                </button>

                <p className="text-xs text-center" style={{ color: "#475569" }}>
                  By submitting you agree to our{" "}
                  <a href="/privacy-policy" className="underline hover:text-white transition-colors">Privacy Policy</a>.
                  No spam. Unsubscribe any time.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
