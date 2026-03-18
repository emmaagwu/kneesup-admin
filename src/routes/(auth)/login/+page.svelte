<script lang="ts">
  import { goto } from '$app/navigation';
  import Logo from '$components/ui/Logo.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { auth } from '$lib/firebase/client';
  import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    type UserCredential
  } from 'firebase/auth';

  let email       = $state('');
  let password    = $state('');
  let showPass    = $state(false);
  let loading     = $state(false);
  let googleLoading = $state(false);
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

  /**
   * Exchange the Firebase ID token for a server-side session cookie.
   * The server will verify userRole === "Admin" in Firestore.
   */
  async function exchangeTokenForSession(credential: UserCredential): Promise<void> {
    const idToken = await credential.user.getIdToken();

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json() as { user?: { uid: string; email: string; displayName: string; photoURL?: string; role: string; createdAt: string }; error?: string };

    if (!response.ok) {
      // Sign out from Firebase client so the user is cleanly logged out
      await auth.signOut();
      throw new Error(data.error ?? 'Authentication failed');
    }

    // Populate the client-side auth store
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

  async function handleGoogleLogin() {
    googleLoading = true;
    error = '';

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await exchangeTokenForSession(credential);
      goto('/dashboard');
    } catch (err: unknown) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        // User closed the popup — not an error we should surface
      } else if (msg.includes('Access denied') || msg.includes('admin privileges')) {
        error = 'Access denied. This Google account does not have admin privileges.';
      } else {
        error = 'Google sign-in failed. Please try again.';
      }
    } finally {
      googleLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Login — KneesUp Venues</title>
</svelte:head>

<div class="min-h-screen flex">

  <!-- ── Left panel (image + copy) ────────────────────────── -->
  <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d1f2d]">
    <!-- Background image -->
    <img
      src="/login_background.jpeg"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover object-center opacity-50"
    />

    <!-- Brand mark bottom-left -->
    <div class="absolute bottom-0 left-0 z-10">
      <svg width="120" height="134" viewBox="0 0 143 159" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M51.9135 35.4062L51.9135 104.481L113.168 40.8365H120.772L88.1898 74.9398L142.711 159.002H79.9373L51.9157 112.735V159.002H0L0 0L16.5073 0C43.8752 0 51.9135 16.0745 51.9135 35.4062Z" fill="#1a2e3b" opacity="0.8"/>
      </svg>
    </div>

    <!-- Copy -->
    <div class="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
      <!-- Logo -->
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

      <!-- Stats -->
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

    <!-- Mobile logo header -->
    <div class="lg:hidden px-6 py-5 border-b border-[#f0f0f0]">
      <Logo size="md"/>
    </div>

    <!-- Form area -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[420px]">

        <!-- Desktop logo -->
        <div class="hidden lg:block mb-8">
          <Logo size="md" showTagline={true} />
        </div>

        <!-- Heading -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-[#111827]">Admin Portal</h2>
          <p class="text-sm text-[#6b7280] mt-1.5">
            Sign in to manage the KneesUp platform. Access is restricted to
            authorized administrators only.
          </p>
        </div>

        <!-- Error banner -->
        {#if error}
          <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg
                      flex items-start gap-2.5 text-sm text-red-700">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        {/if}

        <!-- Google Sign-In -->
        <button
          type="button"
          onclick={handleGoogleLogin}
          disabled={googleLoading || loading}
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border
                 border-[#e5e7eb] hover:bg-[#f9fafb] disabled:opacity-60 disabled:cursor-not-allowed
                 transition-colors text-sm font-medium text-[#374151] mb-5"
        >
          {#if googleLoading}
            <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in with Google...
          {:else}
            <!-- Google G logo SVG -->
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0)">
                <path d="M6.27 0.59C4.47 1.22 2.92 2.40 1.85 3.97 0.77 5.54 0.23 7.42 0.29 9.32 0.36 11.22 1.04 13.05 2.22 14.54 3.41 16.03 5.04 17.10 6.88 17.59 8.37 17.98 9.93 17.99 11.43 17.64 12.79 17.34 14.04 16.69 15.07 15.75 16.14 14.75 16.92 13.47 17.32 12.06 17.76 10.52 17.84 8.91 17.55 7.34H9.18V10.81H14.03C13.93 11.36 13.72 11.89 13.42 12.36 13.11 12.83 12.71 13.24 12.25 13.55 11.65 13.94 10.99 14.21 10.29 14.33 9.59 14.46 8.87 14.46 8.16 14.33 7.45 14.18 6.78 13.89 6.19 13.46 5.24 12.79 4.52 11.84 4.15 10.73 3.77 9.61 3.77 8.39 4.15 7.27 4.42 6.48 4.86 5.77 5.44 5.17 6.11 4.48 6.95 3.99 7.88 3.75 8.81 3.50 9.79 3.52 10.71 3.80 11.42 4.02 12.08 4.40 12.62 4.92 13.17 4.38 13.72 3.83 14.26 3.29 14.54 2.99 14.85 2.71 15.13 2.41 14.30 1.64 13.32 1.04 12.26 0.65 10.33 -0.06 8.22 -0.07 6.27 0.59Z" fill="#E33629"/>
                <path d="M0.46 7.24C0.62 6.47 0.88 5.71 1.23 5.01L4.15 7.27C3.77 8.39 3.77 9.61 4.15 10.73L1.23 12.99C0.34 11.22 0.07 9.19 0.46 7.24Z" fill="#F8BD00"/>
                <path d="M9.18 7.33H17.55C17.84 8.90 17.76 10.52 17.32 12.06 16.92 13.47 16.14 14.75 15.07 15.75L12.25 13.55C12.71 13.24 13.11 12.83 13.42 12.36 13.72 11.89 13.93 11.36 14.03 10.81H9.18V7.33Z" fill="#587DBD"/>
                <path d="M1.23 12.99C2.20 12.24 3.17 11.49 4.15 10.73 4.52 11.84 5.24 12.79 6.19 13.46 6.78 13.89 7.45 14.18 8.17 14.32 8.87 14.45 9.59 14.45 10.29 14.33 10.99 14.21 11.66 13.94 12.25 13.55L15.08 15.74C14.05 16.68 12.79 17.33 11.43 17.64 9.94 17.99 8.37 17.97 6.88 17.59 5.70 17.27 4.60 16.72 3.65 15.96 2.64 15.15 1.81 14.14 1.23 12.99Z" fill="#319F43"/>
              </g>
              <defs>
                <clipPath id="clip0"><rect width="18" height="18" fill="white"/></clipPath>
              </defs>
            </svg>
            Continue with Google
          {/if}
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-5">
          <div class="flex-1 h-px bg-[#e5e7eb]"></div>
          <span class="text-xs text-[#9ca3af] font-medium">or</span>
          <div class="flex-1 h-px bg-[#e5e7eb]"></div>
        </div>

        <!-- Form -->
        <form onsubmit={handleLogin} class="space-y-4">

          <!-- Email -->
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

          <!-- Password -->
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

          <!-- Forgot password -->
          <div class="flex justify-end">
            <a
              href="/auth/login/forgot-password"
              class="text-sm text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            disabled={loading || googleLoading}
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

        <!-- Footer note -->
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

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-[#f9fafb] text-center">
      <p class="text-xs text-[#9ca3af]">
        © {new Date().getFullYear()} KneesUp Venues. Admin Portal.
      </p>
    </div>
  </div>
</div>