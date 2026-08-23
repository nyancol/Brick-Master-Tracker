import { useState, useEffect, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type Listener = (toasts: Toast[]) => void;
let listeners: Listener[] = [];
let memoryToasts: Toast[] = [];
let count = 0;

function emit() {
  const snapshot = [...memoryToasts];
  listeners.forEach((l) => l(snapshot));
}

/** Call from anywhere to show a toast. Auto-dismisses after 5s. */
export function toast(props: Omit<Toast, "id">) {
  const id = String(++count);
  memoryToasts = [...memoryToasts, { ...props, id }];
  emit();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emit();
  }, 5000);

  return id;
}

/** React hook to subscribe to toast state. */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emit();
  }, []);

  return { toasts, toast, dismiss };
}