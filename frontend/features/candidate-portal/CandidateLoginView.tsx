"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { candidateService } from "@/services/candidate.service";

export function CandidateLoginView() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await candidateService.login(form.email, form.password);
      router.push("/candidate/assessments");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1E2430",
    border: "1px solid #2D3748",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#F9FAFB",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B0F", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#D4A63A", letterSpacing: -0.5, marginBottom: 6 }}>
            Naviora
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>Candidate Assessment Portal</div>
        </div>

        {/* Card */}
        <div style={{ background: "#141821", border: "1px solid #1E2430", borderRadius: 14, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F9FAFB", marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28 }}>Sign in to access your assessments</p>

          {error && (
            <div style={{ background: "#EF444415", border: "1px solid #EF444430", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#EF4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={inputStyle}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px 0", borderRadius: 8, border: "none", background: loading ? "#8B6A1A" : "#D4A63A", color: "#0B0B0F", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#4B5563" }}>
          Contact your assessment coordinator for login assistance.
        </div>
      </div>
    </div>
  );
}
