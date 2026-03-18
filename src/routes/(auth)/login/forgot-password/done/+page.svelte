<script lang="ts">
  import { goto } from '$app/navigation';
  import Logo from '$components/ui/Logo.svelte';
  import { authStore } from '$lib/stores/auth.store';

  let { data } = $props();

  $effect(() => {
    if ($authStore.user) goto('/dashboard');
  });
</script>

<svelte:head>
  <title>Check your email — KneesUp Admin</title>
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
      <div class="w-full max-w-[420px] text-center">

        <div class="hidden lg:flex justify-center mb-8">
          <Logo size="md" showTagline={true} />
        </div>

        <!-- Success icon -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 rounded-full bg-[#f0fdf4] border-2 border-[#16a34a]
                      flex items-center justify-center">
            <svg class="w-7 h-7 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-[#111827] mb-3">Check your email</h2>
        <p class="text-sm text-[#6b7280] leading-relaxed mb-2">
          We've sent a password reset link to
        </p>
        <p class="text-sm font-semibold text-[#111827] mb-6">{data.email}</p>
        <p class="text-xs text-[#9ca3af] leading-relaxed mb-8">
          If the email doesn't show up soon, check your spam folder.
          The link will expire in 24 hours.
        </p>

        <button
          onclick={() => goto('/auth/login')}
          class="w-full py-3 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold
                 hover:bg-[#243647] transition-colors"
        >
          Return to Sign In
        </button>

        <p class="mt-5 text-xs text-[#9ca3af]">
          Didn't receive it?
          <a href="/auth/login/forgot-password"
             class="text-[#0d9488] hover:underline font-medium">Try again</a>
        </p>
      </div>
    </div>

    <div class="px-6 py-4 border-t border-[#f9fafb] text-center">
      <p class="text-xs text-[#9ca3af]">© {new Date().getFullYear()} KneesUp Venues. Admin Portal.</p>
    </div>
  </div>
</div>