"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

const toastStore: { toasts: Toast[]; listeners: Set<() => void> } = {
  toasts: [],
  listeners: new Set(),
};

function notify() {
  toastStore.listeners.forEach((l) => l());
}

export function toast(opts: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastStore.toasts = [...toastStore.toasts, { ...opts, id }];
  notify();
  setTimeout(() => {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function useToast() {
  const [, forceUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const update = () => forceUpdate((n) => n + 1);
    toastStore.listeners.add(update);
    return () => toastStore.listeners.delete(update);
  }, []);

  useState(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  });

  const dismiss = (id: string) => {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    notify();
  };

  return { toasts: toastStore.toasts, dismiss };
}
