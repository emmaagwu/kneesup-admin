<script lang="ts">
  import Sidebar from '$components/layout/Sidebar.svelte';
  import MobileNav from '$components/layout/MobileNav.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { sidebarOpen } from '$lib/stores/ui.store';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  // Hydrate the client-side auth store from the server-verified user.
  // This ensures the store is populated immediately without a client-side
  // Firebase round-trip, avoiding flickers on page load.
  $effect(() => {
    if (data.user && !$authStore.user) {
      authStore.setUser(data.user);
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
      {@render children()}
    </main>
  </div>

  <!-- Mobile bottom nav -->
  <MobileNav />
</div>
