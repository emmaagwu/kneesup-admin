import { writable, derived } from 'svelte/store';
import type { AdminUser } from '$lib/types';

// ─── Auth State ───────────────────────────────────────────────────────────────
interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  return {
    subscribe,

    setUser: (user: AdminUser | null) => {
      update((s) => ({ ...s, user, loading: false, error: null }));
    },

    setLoading: (loading: boolean) => {
      update((s) => ({ ...s, loading }));
    },

    setError: (error: string | null) => {
      update((s) => ({ ...s, error, loading: false }));
    },

    reset: () => {
      set({ user: null, loading: false, error: null });
    }
  };
}

export const authStore = createAuthStore();

// ─── Derived ──────────────────────────────────────────────────────────────────
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user);
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const authLoading = derived(authStore, ($auth) => $auth.loading);
