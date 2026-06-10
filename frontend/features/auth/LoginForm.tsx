"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BlueStratumLogo } from "@/components/shared/Logo";
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

        {/* ── Card ───────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">

          {/* ── Card header — PASE Simulator identity ────────── */}
          <div className="relative flex flex-col items-center pt-8 pb-6 px-8
                          bg-gradient-to-b from-[#1A0808] to-[#0D0D2A]">
            {/* Subtle radial glow behind logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <Image
              src="/logos/pase-simulator.png"
              alt="PASE Ship Simulator"
              width={80}
              height={89}
              className="rounded-xl object-cover relative z-10 ring-2 ring-primary/30 shadow-lg"
              priority
            />

            <div className="mt-4 text-center relative z-10">
              <h1 className="text-lg font-bold text-white tracking-wide">
                PASE Compass
              </h1>
              <p className="text-xs text-primary/90 font-medium tracking-widest uppercase mt-0.5">
                Maritime Assessment Platform
              </p>
            </div>
          </div>

          {/* ── Form body ─────────────────────────────────────── */}
          <div className="px-8 pt-6 pb-8">
            <div className="mb-5 text-center">
              <p className="text-sm font-medium text-foreground">Welcome back</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sign in to your account</p>
            </div>

            {/* API error */}
            {apiError && (
              <div className="mb-4 px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pasecompass.com"
                  {...register("email")}
                  className={cn(
                    "w-full bg-background border rounded-md px-3 py-2.5 text-sm text-foreground",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                    errors.email
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:border-primary focus:ring-primary"
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground" htmlFor="password">
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
                      "w-full bg-background border rounded-md px-3 py-2.5 pr-10 text-sm text-foreground",
                      "placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                      errors.password
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:border-primary focus:ring-primary"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className={cn(
                  "w-full flex items-center justify-center gap-2 gradient-gold text-black",
                  "font-semibold text-sm rounded-md py-2.5 px-4 mt-2",
                  "hover:opacity-90 active:opacity-80 transition-opacity",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoggingIn ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Below-card — Blue Stratum parent brand ─────────── */}
        <div className="flex flex-col items-center gap-2 mt-5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Powered by
          </p>
          <BlueStratumLogo size="md" />
        </div>

      </div>
    </div>
  );
}
