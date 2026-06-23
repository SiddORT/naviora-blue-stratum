"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Users, BarChart3, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useOrgAuthStore } from "@/store/org-auth.store";
import { orgLogin, getOrgMe } from "@/services/org-portal.service";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const HIGHLIGHTS = [
  { icon: Users,         text: "Manage your candidates and users" },
  { icon: ClipboardList, text: "Run and track assessment sessions" },
  { icon: BarChart3,     text: "Access organization-level reports" },
];

export function OrgLoginForm() {
  const router = useRouter();
  const { setTokens, setUser } = useOrgAuthStore();
  const [showPass, setShowPass] = useState(false);
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

  const inputBase = cn(
    "w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25",
    "focus:outline-none transition-all duration-200"
  );
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(46,168,255,0.22)",
  };

  return (
    <div className="flex min-h-screen w-full">

      {/* Left — branding */}
      <div className="hidden lg:flex flex-col items-start justify-center flex-1 px-16 xl:px-20 relative">
        <div className="absolute right-0 top-[10%] bottom-[10%] w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(46,168,255,0.3) 30%, rgba(46,168,255,0.3) 70%, transparent)" }} />

        <div className="mb-8">
          <Image
            src="/logos/bluestratum-mark-v2.png"
            alt="Blue Stratum"
            width={220}
            height={148}
            className="object-contain"
            priority
          />
        </div>

        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#2EA8FF", opacity: 0.7 }}>
          Blue Stratum / Naviora
        </div>
        <h1 className="font-black leading-none mb-4"
          style={{
            fontSize: "clamp(2.5rem,5vw,4rem)",
            background: "linear-gradient(135deg, #2EA8FF 0%, #0A6DCC 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}>
          Organization<br />Portal
        </h1>
        <p className="text-sm mb-10 max-w-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>
          Access your organization's training portal, manage candidates, schedule sessions, and review reports.
        </p>
        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: "rgba(46,168,255,0.12)", border: "1px solid rgba(46,168,255,0.25)" }}>
                <Icon className="w-4 h-4" style={{ color: "#2EA8FF" }} />
              </div>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{text}</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 left-16 xl:left-20">
          <p className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(46,168,255,0.50)" }}>
            by Blue Stratum
          </p>
        </div>
      </div>

      {/* Right — login panel */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 px-8 py-12"
        style={{
          background: "rgba(7,14,30,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(46,168,255,0.12)",
        }}>

        <div className="flex flex-col items-center mb-8 lg:hidden">
          <Image
            src="/logos/bluestratum-mark-v2.png"
            alt="Blue Stratum"
            width={140}
            height={94}
            className="object-contain mb-2"
            priority
          />
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Organization Portal</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white">Organization Login</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sign in to your organization's portal
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
                Email Address <span style={{ color: "#2EA8FF" }}>*</span>
              </label>
              <input id="email" type="email" autoComplete="email"
                placeholder="user@organization.com"
                {...register("email")}
                className={inputBase} style={inputStyle}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(46,168,255,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(46,168,255,0.08)"; }}
                onBlur={e => { e.currentTarget.style.border = errors.email ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(46,168,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }} htmlFor="password">
                Password <span style={{ color: "#2EA8FF" }}>*</span>
              </label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"}
                  autoComplete="current-password" placeholder="Enter your password"
                  {...register("password")}
                  className={cn(inputBase, "pr-11")} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(46,168,255,0.65)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(46,168,255,0.08)"; }}
                  onBlur={e => { e.currentTarget.style.border = errors.password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(46,168,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-1 font-semibold text-sm rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: "linear-gradient(135deg,#2EA8FF 0%,#0A6DCC 100%)",
                boxShadow: "0 4px 20px rgba(46,168,255,0.28)",
              }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-2" style={{ borderColor: "rgba(46,168,255,0.12)" }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              Wrong portal?{" "}
              <Link href="/login" className="underline hover:text-white transition-colors">Admin login</Link>
              {" · "}
              <Link href="/candidate/login" className="underline hover:text-white transition-colors">Candidate login</Link>
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-px" style={{ background: "rgba(46,168,255,0.3)" }} />
              <span className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(46,168,255,0.45)" }}>
                Secure Login
              </span>
              <div className="w-4 h-px" style={{ background: "rgba(46,168,255,0.3)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
