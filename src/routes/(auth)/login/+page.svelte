<script lang="ts">
  import { goto } from '$app/navigation';
  import Logo from '$components/ui/Logo.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { auth } from '$lib/firebase/client';
  import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';

  let email       = $state('');
  let password    = $state('');
  let showPass    = $state(false);
  let loading     = $state(false);
  let error       = $state('');
  let emailError  = $state('');
  let passError   = $state('');

  // Redirect immediately if already authenticated
  $effect(() => {
    if ($authStore.user) goto('/dashboard');
  });

  function validate(): boolean {
    emailError = '';
    passError  = '';
    let ok = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError = 'Enter a valid email address';
      ok = false;
    }
    if (!password || password.length < 6) {
      passError = 'Password must be at least 6 characters';
      ok = false;
    }
    return ok;
  }

  async function exchangeTokenForSession(credential: UserCredential): Promise<void> {
    const idToken = await credential.user.getIdToken();

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json() as { user?: { uid: string; email: string; displayName: string; photoURL?: string; role: string; createdAt: string }; error?: string };

    if (!response.ok) {
      await auth.signOut();
      throw new Error(data.error ?? 'Authentication failed');
    }

    authStore.setUser({
      uid: data.user!.uid,
      email: data.user!.email,
      displayName: data.user!.displayName,
      photoURL: data.user?.photoURL,
      role: data.user!.role as 'super_admin' | 'admin' | 'support',
      createdAt: data.user!.createdAt
    });
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    if (!validate()) return;
    loading = true;
    error   = '';

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      await exchangeTokenForSession(credential);
      goto('/dashboard');
    } catch (err: unknown) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('Access denied') || msg.includes('admin privileges')) {
        error = 'Access denied. This account does not have admin privileges.';
      } else if (
        msg.includes('wrong-password') ||
        msg.includes('user-not-found') ||
        msg.includes('invalid-credential') ||
        msg.includes('INVALID_LOGIN_CREDENTIALS')
      ) {
        error = 'Invalid email or password.';
      } else if (msg.includes('too-many-requests')) {
        error = 'Too many failed attempts. Please try again later.';
      } else {
        error = 'Sign in failed. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Login — KneesUp Venues</title>
</svelte:head>

<div class="min-h-screen flex">

  <!-- ── Left panel (image + copy) ────────────────────────── -->
  <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d1f2d]">
    <img
      src="/login_background.jpeg"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover object-center opacity-50"
    />

    <div class="absolute bottom-0 left-0 z-10">
      <svg width="120" height="134" viewBox="0 0 143 159" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M51.9135 35.4062L51.9135 104.481L113.168 40.8365H120.772L88.1898 74.9398L142.711 159.002H79.9373L51.9157 112.735V159.002H0L0 0L16.5073 0C43.8752 0 51.9135 16.0745 51.9135 35.4062Z" fill="#1a2e3b" opacity="0.8"/>
      </svg>
    </div>

    <div class="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
      <div class="mb-12">
        <div class="flex flex-col leading-none select-none">
          <span class="text-2xl font-black tracking-tight text-white">
            knees<span class="text-[#0d9488]">up</span>
            <span class="text-white">&#x2713;</span>
          </span>
          <span class="text-[9px] font-semibold tracking-[0.25em] uppercase text-white/60 mt-0.5">
            VENUES
          </span>
        </div>
      </div>

      <h1 class="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
        Manage the entire<br/>
        <span class="text-[#0d9488]">KneesUp</span><br/>
        platform
      </h1>
      <p class="text-base text-white/70 leading-relaxed max-w-sm">
        Oversee organizations, venues, reservations, and revenue across the
        entire KneesUp ecosystem — all from one place.
      </p>

      <div class="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
        {#each [['100+', 'Organizations'], ['500+', 'Venues'], ['$20K+', 'Revenue']] as [val, label]}
          <div>
            <p class="text-2xl font-black text-white">{val}</p>
            <p class="text-xs text-white/50 mt-0.5">{label}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- ── Right panel (login form) ─────────────────────────── -->
  <div class="flex-1 flex flex-col min-h-screen bg-white">

    <div class="lg:hidden px-6 py-5 border-b border-[#f0f0f0]">
      <Logo size="md"/>
    </div>

    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[420px]">

        <div class="hidden lg:block mb-8">
          <Logo size="md" showTagline={true} />
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-[#111827]">Admin Portal</h2>
          <p class="text-sm text-[#6b7280] mt-1.5">
            Sign in to manage the KneesUp platform. Access is restricted to
            authorized administrators only.
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

        <form onsubmit={handleLogin} class="space-y-4">

          <div>
            <label for="email" class="block text-sm font-medium text-[#374151] mb-1.5">
              Email Address
            </label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input
                id="email"
                type="email"
                bind:value={email}
                placeholder="admin@kneesupvenues.com"
                autocomplete="email"
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border
                       {emailError ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb] hover:border-[#d1d5db]'}
                       focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                       placeholder:text-[#9ca3af] transition-colors"
              />
            </div>
            {#if emailError}<p class="text-xs text-red-500 mt-1">{emailError}</p>{/if}
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-[#374151] mb-1.5">
              Password
            </label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                bind:value={password}
                placeholder="Enter your password"
                autocomplete="current-password"
                class="w-full pl-10 pr-12 py-2.5 text-sm rounded-lg border
                       {passError ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb] hover:border-[#d1d5db]'}
                       focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                       placeholder:text-[#9ca3af] transition-colors"
              />
              <button
                type="button"
                onclick={() => showPass = !showPass}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                       text-[#6b7280] hover:text-[#374151] transition-colors"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            {#if passError}<p class="text-xs text-red-500 mt-1">{passError}</p>{/if}
          </div>

          <div class="flex justify-end">
            <a
              href="/auth/login/forgot-password"
              class="text-sm text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-3 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold
                   hover:bg-[#243647] disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
          >
            {#if loading}
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Signing in...
            {:else}
              Sign In
            {/if}
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-[#9ca3af]">
          Access restricted to KneesUp administrators only.<br/>
          Contact
          <a href="mailto:support@kneesupvenues.com" class="text-[#0d9488] hover:underline">
            support@kneesupvenues.com
          </a>
          for access.
        </p>
      </div>
    </div>

    <div class="px-6 py-4 border-t border-[#f9fafb] text-center">
      <p class="text-xs text-[#9ca3af]">
        © {new Date().getFullYear()} KneesUp Venues. Admin Portal.
      </p>
    </div>
  </div>
</div>