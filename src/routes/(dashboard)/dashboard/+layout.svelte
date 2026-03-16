<script lang="ts">
  import Sidebar from '$components/layout/Sidebar.svelte';
  import MobileNav from '$components/layout/MobileNav.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { sidebarOpen } from '$lib/stores/ui.store';

  // Redirect to landing if not authenticated
  $effect(() => {
    if (!$authStore.user && !$authStore.loading) {
      goto('/');
    }
  });
</script>

<div class="min-h-screen bg-[#f7f8fa]">
  <!-- Sidebar (desktop) -->
  <Sidebar />

  <!-- Main content: TopBar is rendered per-page so it can carry per-page actions -->
  <div
    class="flex flex-col min-h-screen transition-all duration-200
           {$sidebarOpen ? 'lg:pl-[220px]' : 'lg:pl-[60px]'}"
  >
    <main class="flex-1 pb-20 lg:pb-0">
      <slot />
    </main>
  </div>

  <!-- Mobile bottom nav -->
  <MobileNav />
</div>
