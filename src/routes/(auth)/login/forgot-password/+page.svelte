<script lang="ts">
  import { goto } from '$app/navigation';
  import Logo from '$components/ui/Logo.svelte';
  import { authStore } from '$lib/stores/auth.store';

  let email   = $state('');
  let loading = $state(false);
  let error   = $state('');

  $effect(() => {
    if ($authStore.user) goto('/dashboard');
  });

  async function handleReset(e: Event) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = 'Please enter a valid email address.';
      return;
    }
    loading = true;
    error   = '';

    try {
      // TODO: replace with Firebase
      // const { sendPasswordResetEmail } = await import('firebase/auth');
      // const { auth } = await import('$lib/firebase.client');
      // await sendPasswordResetEmail(auth, email);

      await new Promise(r => setTimeout(r, 900)); // mock
      goto(`/auth/login/forgot-password/done?email=${encodeURIComponent(email)}`);
    } catch {
      error = 'Failed to send reset email. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Forgot Password — KneesUp Admin</title>
</svelte:head>

<div class="min-h-screen flex">

  <!-- Left panel -->
  <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d1f2d]">
    <img src="/login_background.jpeg" alt="" aria-hidden="true"
         class="absolute inset-0 w-full h-full object-cover opacity-50"/>
    <div class="absolute bottom-0 left-0 z-10">
      <svg width="120" height="134" viewBox="0 0 143 159" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M51.9135 35.4062L51.9135 104.481L113.168 40.8365H120.772L88.1898 74.9398L142.711 159.002H79.9373L51.9157 112.735V159.002H0L0 0L16.5073 0C43.8752 0 51.9135 16.0745 51.9135 35.4062Z" fill="#1a2e3b" opacity="0.8"/>
      </svg>
    </div>
    <div class="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
      <div class="mb-12">
        <div class="flex flex-col leading-none select-none">
          <span class="text-2xl font-black tracking-tight text-white">
            knees<span class="text-[#0d9488]">up</span><span class="text-white">&#x2713;</span>
          </span>
          <span class="text-[9px] font-semibold tracking-[0.25em] uppercase text-white/60 mt-0.5">VENUES</span>
        </div>
      </div>
      <h1 class="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
        Manage the entire<br/><span class="text-[#0d9488]">KneesUp</span><br/>platform
      </h1>
      <p class="text-base text-white/70 leading-relaxed max-w-sm">
        Secure admin access to manage organizations, venues, reservations, and revenue.
      </p>
    </div>
  </div>

  <!-- Right panel -->
  <div class="flex-1 flex flex-col min-h-screen bg-white">

    <div class="lg:hidden px-6 py-5 border-b border-[#f0f0f0]">
      <Logo size="md" showTagline={true} />
    </div>

    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[420px]">

        <!-- Back button -->
        <button
          onclick={() => goto('/auth/login')}
          class="flex items-center gap-1.5 text-sm font-medium text-[#374151]
                 hover:text-[#111827] transition-colors mb-8"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Sign In
        </button>

        <div class="hidden lg:block mb-8">
          <Logo size="md" showTagline={true} />
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-[#111827]">Forgot your password?</h2>
          <p class="text-sm text-[#6b7280] mt-1.5">
            Enter your admin email address and we'll send you a link to reset your password.
          </p>
        </div>

        {#if error}
          <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg
                      flex items-start gap-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        {/if}

        <form onsubmit={handleReset} class="space-y-4">
          <div>
            <label for="reset-email" class="block text-sm font-medium text-[#374151] mb-1.5">
              Email Address
            </label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input
                id="reset-email"
                type="email"
                bind:value={email}
                placeholder="admin@kneesupvenues.com"
                autocomplete="email"
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb]
                       hover:border-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#0d9488]
                       focus:border-transparent placeholder:text-[#9ca3af] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-3 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold
                   hover:bg-[#243647] disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {#if loading}
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Sending...
            {:else}
              Send Reset Link
            {/if}
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-[#9ca3af]">
          Remember your password?
          <a href="/auth/login" class="text-[#0d9488] hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>

    <div class="px-6 py-4 border-t border-[#f9fafb] text-center">
      <p class="text-xs text-[#9ca3af]">© {new Date().getFullYear()} KneesUp Venues. Admin Portal.</p>
    </div>
  </div>
</div>