import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts.slice(-4), newToast] })); // Max 5 visible toasts
    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (title: string, message?: string, durationMs = 4000) =>
    useToastStore.getState().addToast({ type: 'success', title, message, durationMs }),
  error: (title: string, message?: string, durationMs = 6000) =>
    useToastStore.getState().addToast({ type: 'error', title, message, durationMs }),
  warning: (title: string, message?: string, durationMs = 5000) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, durationMs }),
  info: (title: string, message?: string, durationMs = 4000) =>
    useToastStore.getState().addToast({ type: 'info', title, message, durationMs }),
};
