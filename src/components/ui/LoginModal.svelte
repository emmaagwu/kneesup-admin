<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Logo from '$lib/components/ui/Logo.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import type { AdminUser } from '$lib/types';

  export let open = false;

  const dispatch = createEventDispatcher<{ close: void; success: void }>();

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let emailError = '';
  let passwordError = '';
  let showPassword = false;

  function validate(): boolean {
    emailError = '';
    passwordError = '';
    let valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError = 'Please enter a valid email address';
      valid = false;
    }
    if (!password || password.length < 6) {
      passwordError = 'Password must be at least 6 characters';
      valid = false;
    }
    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;
    loading = true;
    error = '';

    try {
      // TODO: Replace with actual Firebase auth
      await new Promise((r) => setTimeout(r, 1200));

      // Mock successful login
      const mockUser: AdminUser = {
        uid: 'admin-001',
        email,
        displayName: 'Opeyemi Adesina',
        role: 'super_admin',
        createdAt: new Date().toISOString()
      };

      authStore.setUser(mockUser);
      dispatch('success');
    } catch (e: unknown) {
      error = 'Invalid credentials. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    if (!loading) {
      email = '';
      password = '';
      error = '';
      dispatch('close');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    on:click={handleClose}
  >
    <!-- Modal -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="
        relative w-full max-w-md bg-white rounded-2xl shadow-2xl
        animate-in
      "
      on:click|stopPropagation
    >
      <!-- Close button -->
      <button
        on:click={handleClose}
        class="absolute right-4 top-4 w-8 h-8 flex items-center justify-center
               rounded-lg text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6]
               transition-colors z-10"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div class="px-8 pt-8 pb-6 border-b border-[#f3f4f6]">
        <div class="mb-5">
          <Logo size="md" showTagline={true} />
        </div>
        <h2 class="text-xl font-bold text-[#111827]">Admin Portal Login</h2>
        <p class="text-sm text-[#6b7280] mt-1">
          Sign in to access the administration dashboard.
        </p>
      </div>

      <!-- Form -->
      <div class="px-8 py-6">
        {#if error}
          <div
            class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg
                   flex items-center gap-2.5 text-sm text-red-700"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        {/if}

        <div class="space-y-4">
          <Input
            label="Email Address"
            type="email"
            bind:value={email}
            placeholder="admin@kneesupvenues.com"
            error={emailError}
            required
            icon={`<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>`}
          />

          <div class="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              placeholder="Enter your password"
              error={passwordError}
              required
              icon={`<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>`}
            />
            <button
              type="button"
              on:click={() => (showPassword = !showPassword)}
              class="absolute right-3 bottom-[10px] text-[#9ca3af] hover:text-[#374151] transition-colors"
            >
              {#if showPassword}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              {/if}
            </button>
          </div>

          <div class="flex items-center justify-end">
            <button class="text-sm text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <div class="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            {loading}
            on:click={handleLogin}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>

        <p class="mt-5 text-center text-xs text-[#9ca3af]">
          Access is restricted to authorized administrators only.
          <br />Contact{' '}
          <a href="mailto:support@kneesupvenues.com" class="text-[#0d9488] hover:underline">
            support@kneesupvenues.com
          </a>
          {' '}for access.
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-in {
    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
