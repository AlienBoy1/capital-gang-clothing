"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-4),
    }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function toast(input: {
  tone?: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}) {
  const id = useToastStore.getState().push({
    tone: input.tone ?? "info",
    title: input.title,
    description: input.description,
  });
  const duration = input.durationMs ?? (input.tone === "error" ? 5200 : 3800);
  if (typeof window !== "undefined") {
    window.setTimeout(() => useToastStore.getState().dismiss(id), duration);
  }
  return id;
}

export const notify = {
  success: (title: string, description?: string) => toast({ tone: "success", title, description }),
  error: (title: string, description?: string) => toast({ tone: "error", title, description }),
  info: (title: string, description?: string) => toast({ tone: "info", title, description }),
};
