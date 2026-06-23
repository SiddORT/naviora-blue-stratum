"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Anchor, Ship, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { orgLogin, getOrgMe } from "@/services/org-portal.service";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: Ship,      text: "Maritime Organization Portal" },
  { icon: Anchor,    text: "Candidate & Assessment Management" },
  { icon: BarChart3, text: "Subscription & Reporting" },
];

export function OrgLoginForm() {
  const router = useRouter();
  const { setTokens, setUser } = useOrgAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await orgLogin(data.email, data.password);
      if (!res?.data?.access_token) {
        setApiError(res?.message ?? "Login failed. Check your credentials.");
        return;
      }
      const { access_token, refresh_token } = res.data;
      setTokens(access_token, refresh_token);
      const me = await getOrgMe(access_token);
      setUser(me);
      router.replace("/org/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed. Please check your credentials.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#0B0B0F" }}>
      {/* Left hero */}
      <div className="hidden lg:flex flex-col items-start justify-center flex-1 px-16 xl:px-20 relative"
           style={{ background: "linear-gradient(135deg, #0B0B0F 0%, #0A1C1E 60%, #0B1A2E 100%)" }}>
        <div className="absolute right-0 top-[10%] bottom-[10%] w-px"
             style={{ background: "linear-gradient(to bottom, transparent, rgba(212,166,58,0.3) 30%, rgba(212,166,58,0.3) 70%, transparent)" }} />

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #D4A63A, #B8860B)" }}>
              <Ship className="w-4 h-4 text-black" />
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{ color: "rgba(212,166,58,0.8)" }}>
              Blue Stratum
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-none mb-1"
              style={{ color: "#D4A63A", fontFamily: "var(--font-inter)" }}>
            Naviora
          </h1>
          <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Organization Portal
          </p>
        </div>

        <div className="space-y-5 mb-12">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}>
                <Icon className="w-4 h-4" style={{ color: "#D4A63A" }} />
              </div>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-16 xl:left-20">
          <p className="text-[11px] tracking-widest uppercase"
             style={{ color: "rgba(255,255,255,0.2)" }}>
            by Blue Stratum
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[480px] xl:w-[520px] px-8 py-12 flex-shrink-0"
           style={{ background: "#0F1923", borderLeft: "1px solid rgba(212,166,58,0.08)" }}>
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Organization Login</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sign in to your organization portal
            </p>
          </div>

          {apiError && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm"
                 style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                     style={{ color: "rgba(255,255,255,0.5)" }}>
                Email Address <span style={{ color: "#D4A63A" }}>*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@yourorg.com"
                {...register("email")}
                className={cn("w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none transition-all duration-200")}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.2)",
                }}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(212,166,58,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,166,58,0.08)"; }}
                onBlur={e  => { e.currentTarget.style.border = errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                     style={{ color: "rgba(255,255,255,0.5)" }}>
                Password <span style={{ color: "#D4A63A" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={cn("w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 focus:outline-none transition-all duration-200")}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.2)",
                  }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(212,166,58,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,166,58,0.08)"; }}
                  onBlur={e  => { e.currentTarget.style.border = errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "rgba(255,255,255,0.35)" }} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-1 font-semibold text-sm rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #D4A63A 0%, #B8860B 100%)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(212,166,58,0.28)",
              }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 flex items-center justify-center gap-2"
               style={{ borderTop: "1px solid rgba(212,166,58,0.12)" }}>
            <div className="w-4 h-px" style={{ background: "rgba(212,166,58,0.3)" }} />
            <span className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(212,166,58,0.45)" }}>
              Secure Login
            </span>
            <div className="w-4 h-px" style={{ background: "rgba(212,166,58,0.3)" }} />
          </div>

          <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Admin panel?{" "}
            <a href="/login" className="underline hover:opacity-80 transition-opacity"
               style={{ color: "rgba(212,166,58,0.6)" }}>
              Admin Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
