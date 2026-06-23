"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Award, BookOpen, FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { candidateService } from "@/services/candidate.service";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const HIGHLIGHTS = [
  { icon: BookOpen, text: "Access your assessment schedule" },
  { icon: FileText, text: "Review session results and feedback" },
  { icon: Award,    text: "Download your certificates" },
];

export function CandidateLoginForm() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setIsLoading(true);
    try {
      await candidateService.login(data.email, data.password);
      router.replace("/candidate/assessments");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed. Please check your credentials.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = cn(
    "w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25",
    "focus:outline-none transition-all duration-200"
  );
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,166,58,0.25)" };

  return (
    <div className="flex min-h-screen w-full">

      {/* Left — branding */}
      <div className="hidden lg:flex flex-col items-start justify-center flex-1 px-16 xl:px-20 relative">
        <div className="absolute right-0 top-[10%] bottom-[10%] w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(212,166,58,0.3) 30%, rgba(212,166,58,0.3) 70%, transparent)" }} />

        <div className="mb-8">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
            <path d="M24 6C13.954 6 6 13.954 6 24C6 34.046 13.954 42 24 42" stroke="#2EA8FF" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M24 6C34.046 6 42 13.954 42 24C42 34.046 34.046 42 24 42" stroke="#D4A63A" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="5" fill="#D4A63A"/>
          </svg>
        </div>

        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#D4A63A", opacity: 0.7 }}>
          Blue Stratum / Naviora
        </div>
        <h1 className="font-black leading-none mb-4"
          style={{
            fontSize: "clamp(2.5rem,5vw,4rem)",
            background: "linear-gradient(135deg, #D4A63A 0%, #B8860B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}>
          Candidate<br />Portal
        </h1>
        <p className="text-sm mb-10 max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>
          Access your assessments, view session results, and download your digital competency certificates.
        </p>
        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: "rgba(212,166,58,0.12)", border: "1px solid rgba(212,166,58,0.25)" }}>
                <Icon className="w-4 h-4" style={{ color: "#D4A63A" }} />
              </div>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{text}</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 left-16 xl:left-20">
          <p className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(212,166,58,0.50)" }}>
            by Blue Stratum
          </p>
        </div>
      </div>

      {/* Right — login panel */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 px-8 py-12"
        style={{
          background: "rgba(11,11,15,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(212,166,58,0.12)",
        }}>

        <div className="flex flex-col items-center mb-8 lg:hidden">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-2">
            <path d="M24 6C13.954 6 6 13.954 6 24C6 34.046 13.954 42 24 42" stroke="#2EA8FF" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M24 6C34.046 6 42 13.954 42 24C42 34.046 34.046 42 24 42" stroke="#D4A63A" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="5" fill="#D4A63A"/>
          </svg>
          <h1 className="text-2xl font-black" style={{ color: "#D4A63A" }}>Naviora</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Candidate Portal</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white">Candidate Login</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sign in to access your assessments
            </p>
          </div>

          {apiError && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }} htmlFor="email">
                Email Address <span style={{ color: "#D4A63A" }}>*</span>
              </label>
              <input id="email" type="email" autoComplete="email"
                placeholder="your@email.com"
                {...register("email")}
                className={inputBase} style={inputStyle}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(212,166,58,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,166,58,0.07)"; }}
                onBlur={e => { e.currentTarget.style.border = errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }} htmlFor="password">
                Password <span style={{ color: "#D4A63A" }}>*</span>
              </label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"}
                  autoComplete="current-password" placeholder="Enter your password"
                  {...register("password")}
                  className={cn(inputBase, "pr-11")} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(212,166,58,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,166,58,0.07)"; }}
                  onBlur={e => { e.currentTarget.style.border = errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,166,58,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 mt-1 font-semibold text-sm rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
              style={{
                background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)",
                boxShadow: "0 4px 20px rgba(212,166,58,0.28)",
              }}>
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin text-black" />Signing in...</> : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-2" style={{ borderColor: "rgba(212,166,58,0.12)" }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              Wrong portal?{" "}
              <Link href="/login" className="underline hover:text-white transition-colors">Admin login</Link>
              {" · "}
              <Link href="/org/login" className="underline hover:text-white transition-colors">Organization login</Link>
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-px" style={{ background: "rgba(212,166,58,0.3)" }} />
              <span className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(212,166,58,0.45)" }}>
                Secure Login
              </span>
              <div className="w-4 h-px" style={{ background: "rgba(212,166,58,0.3)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
