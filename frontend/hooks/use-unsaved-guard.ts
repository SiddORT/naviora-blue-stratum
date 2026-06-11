"use client";

import { useEffect, useRef, useState } from "react";

export function useUnsavedGuard(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function guardNavigation(action: () => void) {
    if (!isDirty) {
      action();
      return;
    }
    pendingAction.current = action;
    setShowModal(true);
  }

  function confirmLeave() {
    setShowModal(false);
    pendingAction.current?.();
    pendingAction.current = null;
  }

  function cancelLeave() {
    setShowModal(false);
    pendingAction.current = null;
  }

  return { showModal, guardNavigation, confirmLeave, cancelLeave };
}
