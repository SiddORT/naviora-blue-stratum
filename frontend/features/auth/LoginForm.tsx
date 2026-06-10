"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

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
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <Logo className="mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Error */}
          {apiError && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {apiError}
            </div>
          )}

          {/* Form */}
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          PASE Compass &copy; {new Date().getFullYear()} Blue Stratum. All rights reserved.
        </p>
      </div>
    </div>
  );
}
