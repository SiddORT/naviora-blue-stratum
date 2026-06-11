"use client";

import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  default:     <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />,
  success:     <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />,
  destructive: <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 bg-card border rounded-lg px-4 py-3 shadow-xl",
            "animate-in slide-in-from-right-5 duration-200",
            t.variant === "destructive" && "border-destructive/40 bg-destructive/5",
            t.variant === "success"     && "border-green-500/30 bg-green-500/5",
            (!t.variant || t.variant === "default") && "border-border",
          )}
        >
          {icons[t.variant ?? "default"]}
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className="text-sm font-semibold text-foreground leading-tight">{t.title}</p>
            )}
            {t.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
