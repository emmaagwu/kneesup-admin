<script lang="ts">
  import { page } from '$app/stores';
  import Avatar from '$components/ui/Avatar.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { sidebarOpen, toggleSidebar } from '$lib/stores/ui.store';

  interface Action {
    label: string;
    icon?: string;
    href?: string;
    onclick?: () => void;
    variant?: 'primary' | 'secondary';
  }

  let {
    breadcrumbs = [],
    actions = []
  }: {
    breadcrumbs?: { label: string; href?: string }[];
    actions?: Action[];
  } = $props();

  let user = $derived($authStore.user);

  let computedBreadcrumbs = $derived(
    breadcrumbs.length
      ? breadcrumbs
      : (() => {
          const segments = $page.url.pathname.split('/').filter(Boolean);
          const crumbs = [{ label: 'Home', href: '/dashboard' }];
          if (segments.length > 1) {
            const last = segments[segments.length - 1];
            crumbs.push({
              label: last
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            });
          }
          return crumbs;
        })()
  );
</script>

<header class="sticky top-0 z-20 bg-white border-b border-[#f0f0f0] px-4 lg:px-6 h-14 flex items-center justify-between gap-4">

  <!-- Left: collapse toggle + breadcrumbs -->
  <div class="flex items-center gap-3 min-w-0">

    <!-- Collapse toggle (desktop only) -->
    <button
      onclick={toggleSidebar}
      class="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] transition-colors shrink-0"
      title={$sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {#if $sidebarOpen}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      {/if}
    </button>

    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-sm min-w-0">
      {#each computedBreadcrumbs as crumb, i}
        {#if i > 0}
          <span class="text-[#d1d5db]">/</span>
        {/if}
        {#if crumb.href && i < computedBreadcrumbs.length - 1}
          <a href={crumb.href} class="text-[#9ca3af] hover:text-[#374151] transition-colors truncate">
            {crumb.label}
          </a>
        {:else}
          <span class="font-semibold text-[#111827] truncate">{crumb.label}</span>
        {/if}
      {/each}
    </nav>
  </div>

  <!-- Right: notifications + settings + avatar -->
  <div class="flex items-center gap-1.5 shrink-0">

    <!-- Notification bell -->
    <button class="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
      <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
    </button>

    <!-- Settings -->
    <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
      <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Divider -->
    <div class="w-px h-5 bg-[#e5e7eb] mx-1" />

    <!-- User avatar + chevron -->
    {#if user}
      <button class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[#f3f4f6] transition-colors">
        <Avatar name={user.displayName} src={user.photoURL} size="sm" />
        <span class="hidden sm:block text-sm font-medium text-[#374151] max-w-[100px] truncate">
          {user.displayName.split(' ')[0]}
        </span>
        <svg class="w-3.5 h-3.5 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    {/if}
  </div>
</header>