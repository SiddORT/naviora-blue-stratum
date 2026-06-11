"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Anchor, ShieldCheck, BarChart3 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Anchor,       text: "Maritime Assessment & Simulation" },
  { icon: ShieldCheck,  text: "Competency & Certification Tracking" },
  { icon: BarChart3,    text: "Enterprise Reporting & Analytics" },
];

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormValues) => {
    setApiError(null);
    login(data, {
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Login failed. Please check your credentials.";
        setApiError(msg);
      },
    });
  };

  return (
    <div className="flex min-h-screen w-full">

      {/* ════════════════════════════════════════════════════════
          LEFT — branding hero (hidden on small screens)
      ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col items-start justify-center flex-1 px-16 xl:px-20 relative">

        {/* Vertical teal rule */}
        <div className="absolute right-0 top-[10%] bottom-[10%] w-px"
             style={{ background: "linear-gradient(to bottom, transparent, rgba(24,178,188,0.3) 30%, rgba(24,178,188,0.3) 70%, transparent)" }} />

        {/* Logo */}
        <Image
          src="/logos/bluestratum-mark-v2.png"
          alt="Blue Stratum"
          width={240}
          height={160}
          className="object-contain mb-8"
          priority
        />

        {/* Naviora — large gradient headline */}
        <h1 className="font-black leading-none mb-4"
            style={{
              fontSize: "clamp(3.5rem, 7vw, 6rem)",
              background: "linear-gradient(135deg, #F5A623 0%, #FFD580 40%, #18B2BC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}>
          Naviora
        </h1>

        {/* Tagline */}
        <p className="text-lg font-medium mb-2"
           style={{ color: "rgba(255,255,255,0.80)", letterSpacing: "0.04em" }}>
          Maritime Assessment Platform
        </p>
        <p className="text-sm mb-10 max-w-sm"
           style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>
          Enterprise-grade simulation, competency, certification
          and reporting — purpose-built for maritime operations.
        </p>

        {/* Feature pills */}
        <div className="flex flex-col gap-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                   style={{ background: "rgba(24,178,188,0.12)", border: "1px solid rgba(24,178,188,0.25)" }}>
                <Icon className="w-4 h-4" style={{ color: "#18B2BC" }} />
              </div>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div className="absolute bottom-8 left-16 xl:left-20">
          <p className="text-[11px] tracking-widest uppercase"
             style={{ color: "rgba(24,178,188,0.50)" }}>
            by Blue Stratum
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT — login panel
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 px-8 py-12"
           style={{
             background: "rgba(7,27,30,0.60)",
             backdropFilter: "blur(24px)",
             WebkitBackdropFilter: "blur(24px)",
             borderLeft: "1px solid rgba(24,178,188,0.12)",
           }}>

        {/* Mobile-only logo (shows on small screens where left panel is hidden) */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
          <Image
            src="/logos/bluestratum-mark-v2.png"
            alt="Blue Stratum"
            width={180}
            height={120}
            className="object-contain"
            priority
          />
          <h1 className="mt-3 text-2xl font-black"
              style={{
                background: "linear-gradient(135deg, #F5A623 0%, #18B2BC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
            Naviora
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Maritime Assessment Platform
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sign in to your account
            </p>
          </div>

          {apiError && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-sm"
                 style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                     style={{ color: "rgba(255,255,255,0.5)" }}
                     htmlFor="email">
                Email address <span style={{ color: "#F5A623" }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@naviora.app"
                {...register("email")}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25",
                  "focus:outline-none transition-all duration-200"
                )}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: errors.email
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(24,178,188,0.22)",
                }}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(24,178,188,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.08)"; }}
                onBlur={e  => { e.currentTarget.style.border = errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(24,178,188,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                     style={{ color: "rgba(255,255,255,0.5)" }}
                     htmlFor="password">
                Password <span style={{ color: "#F5A623" }}>*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25",
                    "focus:outline-none transition-all duration-200"
                  )}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: errors.password
                      ? "1px solid rgba(239,68,68,0.5)"
                      : "1px solid rgba(24,178,188,0.22)",
                  }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(24,178,188,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.08)"; }}
                  onBlur={e  => { e.currentTarget.style.border = errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(24,178,188,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 mt-1 font-semibold text-sm rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(245,166,35,0.28)",
              }}
              onMouseEnter={e => { if (!isLoggingIn) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 28px rgba(245,166,35,0.48)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(245,166,35,0.28)"; }}
            >
              {isLoggingIn ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 flex items-center justify-center gap-2"
               style={{ borderTop: "1px solid rgba(24,178,188,0.12)" }}>
            <div className="w-4 h-px" style={{ background: "rgba(24,178,188,0.3)" }} />
            <span className="text-[11px] tracking-widest uppercase"
                  style={{ color: "rgba(24,178,188,0.45)" }}>
              Secure Login
            </span>
            <div className="w-4 h-px" style={{ background: "rgba(24,178,188,0.3)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
