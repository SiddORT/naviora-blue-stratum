"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 bg-surface border border-border rounded-lg p-4 shadow-lg",
            "animate-in slide-in-from-right-full",
            toast.variant === "destructive" && "border-destructive/50 bg-destructive/10"
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
