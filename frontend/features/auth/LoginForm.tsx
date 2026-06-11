"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
      <div className="w-full max-w-sm">

        {/* ── Brand hero ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-7">
          <Image
            src="/logos/bluestratum-mark.png"
            alt="Blue Stratum"
            width={220}
            height={147}
            className="object-contain drop-shadow-[0_0_32px_rgba(24,178,188,0.35)]"
            priority
          />
          <div className="mt-4 text-center">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase"
               style={{ color: "rgba(24,178,188,0.85)" }}>
              Blue Stratum
            </p>
            <h1 className="text-xl font-bold text-white tracking-wide mt-1">
              Naviora
            </h1>
            <p className="text-xs mt-0.5 tracking-wide"
               style={{ color: "rgba(255,255,255,0.45)" }}>
              Maritime Assessment Platform
            </p>
          </div>
        </div>

        {/* ── Glass card ─────────────────────────────────────────── */}
        <div className="rounded-2xl px-8 pt-7 pb-8"
             style={{
               background: "rgba(13, 42, 46, 0.55)",
               backdropFilter: "blur(28px)",
               WebkitBackdropFilter: "blur(28px)",
               border: "1px solid rgba(245, 166, 35, 0.22)",
               boxShadow: "0 8px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(245,166,35,0.10)",
             }}>

          <div className="mb-5 text-center">
            <p className="text-sm font-semibold text-white">Welcome back</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sign in to your account
            </p>
          </div>

          {apiError && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-sm"
                 style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-wide uppercase"
                     style={{ color: "rgba(255,255,255,0.6)" }}
                     htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@naviora.app"
                {...register("email")}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30",
                  "focus:outline-none transition-all duration-200",
                  errors.email ? "ring-1 ring-red-500/60" : ""
                )}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: errors.email
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(24,178,188,0.25)",
                }}
                onFocus={e => { if (!errors.email) e.currentTarget.style.border = "1px solid rgba(24,178,188,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.10)"; }}
                onBlur={e  => { e.currentTarget.style.border = errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(24,178,188,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-wide uppercase"
                     style={{ color: "rgba(255,255,255,0.6)" }}
                     htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/30",
                    "focus:outline-none transition-all duration-200",
                    errors.password ? "ring-1 ring-red-500/60" : ""
                  )}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: errors.password
                      ? "1px solid rgba(239,68,68,0.5)"
                      : "1px solid rgba(24,178,188,0.25)",
                  }}
                  onFocus={e => { if (!errors.password) e.currentTarget.style.border = "1px solid rgba(24,178,188,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(24,178,188,0.10)"; }}
                  onBlur={e  => { e.currentTarget.style.border = errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(24,178,188,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
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
              className={cn(
                "w-full flex items-center justify-center gap-2 mt-2",
                "font-semibold text-sm rounded-xl py-3 px-4",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{
                background: "linear-gradient(135deg, #F5A623 0%, #D4820A 100%)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(245,166,35,0.30)",
              }}
              onMouseEnter={e => { if (!isLoggingIn) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 28px rgba(245,166,35,0.50)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(245,166,35,0.30)"; }}
            >
              {isLoggingIn ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* ── Teal divider line ─────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
          <div className="flex-1 h-px" style={{ background: "rgba(24,178,188,0.4)" }} />
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(24,178,188,0.8)" }}>
            Secure Login
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(24,178,188,0.4)" }} />
        </div>

      </div>
    </div>
  );
}
