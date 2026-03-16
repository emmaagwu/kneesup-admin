<script lang="ts">
  import { page } from '$app/stores';
  import Logo from '$components/ui/Logo.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { sidebarOpen } from '$lib/stores/ui.store';
  import { mainNavItems, supportNavItems } from './nav-items';
  import { goto } from '$app/navigation';

  let user = $derived($authStore.user);
  let currentPath = $derived($page.url.pathname);
  let open = $derived($sidebarOpen);

  function isActive(href: string): boolean {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(href);
  }

  async function handleLogout() {
    authStore.reset();
    goto('/');
  }
</script>

<aside
  class="
    hidden lg:flex flex-col
    {open ? 'w-[220px]' : 'w-[60px]'}
    min-h-screen bg-white border-r border-[#f0f0f0]
    fixed left-0 top-0 bottom-0 z-30
    transition-all duration-200 overflow-hidden
  "
>
  <!-- Logo -->
  <div class="h-14 flex items-center border-b border-[#f5f5f5] shrink-0 {open ? 'px-5' : 'px-0 justify-center'}">
    {#if open}
      <a href="/dashboard" class="block">
        <Logo size="md"/>
      </a>
    {:else}
      <!-- Collapsed: show small teal dot / brand mark -->
      <a href="/dashboard" class="w-8 h-8 rounded-lg bg-[#134e4a] flex items-center justify-center text-white font-black text-sm">
        K
      </a>
    {/if}
  </div>

  <!-- Search (only when open) -->
  {#if open}
    <div class="px-4 py-3">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f9fafb] border border-[#f0f0f0] text-sm text-[#9ca3af] cursor-pointer hover:border-[#e5e7eb] transition-colors duration-150">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="text-xs">Search</span>
      </div>
    </div>
  {:else}
    <div class="py-3 flex justify-center">
      <button class="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  {/if}

  <!-- Main nav -->
  <nav class="flex-1 px-2 pb-2 overflow-y-auto overflow-x-hidden">
    {#if open}
      <p class="px-2 py-2 text-[10px] font-bold tracking-widest uppercase text-[#c4c4c4]">Main Menu</p>
    {/if}

    <ul class="space-y-0.5">
      {#each mainNavItems as item}
        <li>
          <a
            href={item.href}
            title={!open ? item.label : undefined}
            class="
              flex items-center rounded-lg text-sm font-medium
              transition-all duration-150
              {open ? 'gap-2.5 px-3 py-2.5' : 'justify-center w-9 h-9 mx-auto'}
              {isActive(item.href)
                ? 'bg-[#134e4a] text-white'
                : 'text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111827]'}
            "
          >
            <span class="shrink-0 {isActive(item.href) ? 'text-white' : 'text-[#6b7280]'}">
              <svelte:component this={item.icon} class="w-4 h-4"/>
            </span>
            {#if open}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Support section -->
  <div class="px-2 pb-2 border-t border-[#f5f5f5] pt-2">
    {#if open}
      <p class="px-2 py-2 text-[10px] font-bold tracking-widest uppercase text-[#c4c4c4]">Support</p>
    {/if}
    <ul class="space-y-0.5">
      {#each supportNavItems as item}
        <li>
          <a
            href={item.href}
            title={!open ? item.label : undefined}
            class="
              flex items-center rounded-lg text-sm font-medium
              transition-all duration-150
              {open ? 'gap-2.5 px-3 py-2.5' : 'justify-center w-9 h-9 mx-auto'}
              {isActive(item.href)
                ? 'bg-[#134e4a] text-white'
                : 'text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111827]'}
            "
          >
            <span class="shrink-0 {isActive(item.href) ? 'text-white' : 'text-[#6b7280]'}">
              <svelte:component this={item.icon} class="w-4 h-4"/>
            </span>
            {#if open}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <!-- User profile footer -->
  <div class="border-t border-[#f0f0f0] bg-[#fafafa] {open ? 'px-4 py-4' : 'px-2 py-3'}">
    {#if user}
      {#if open}
        <div class="flex items-center gap-2.5">
          <Avatar name={user.displayName} src={user.photoURL} size="md" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[#111827] truncate">{user.displayName}</p>
            <p class="text-[11px] text-[#9ca3af] truncate">{user.email}</p>
          </div>
          <button
            onclick={handleLogout}
            class="text-[#9ca3af] hover:text-[#374151] transition-colors p-1 rounded"
            title="Logout"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      {:else}
        <!-- Collapsed: just avatar centered -->
        <div class="flex justify-center">
          <button onclick={handleLogout} title="Logout">
            <Avatar name={user.displayName} src={user.photoURL} size="sm" />
          </button>
        </div>
      {/if}
    {/if}
  </div>
</aside>