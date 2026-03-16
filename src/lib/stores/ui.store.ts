import { writable } from 'svelte/store';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const sidebarOpen = writable(true);

export function toggleSidebar() {
  sidebarOpen.update((v) => !v);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalState {
  id: string | null;
  data?: unknown;
}

export const modal = writable<ModalState>({ id: null });

export function openModal(id: string, data?: unknown) {
  modal.set({ id, data });
}

export function closeModal() {
  modal.set({ id: null });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export const toasts = writable<Toast[]>([]);

export function addToast(type: ToastType, message: string, duration = 4000) {
  const id = crypto.randomUUID();
  toasts.update((t) => [...t, { id, type, message, duration }]);
  setTimeout(() => removeToast(id), duration);
}

export function removeToast(id: string) {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}
