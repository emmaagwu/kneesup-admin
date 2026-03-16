<script lang="ts">
  import { page } from '$app/stores';
  import { mainNavItems } from './nav-items';

  // Show only 5 items in bottom nav on mobile
  const mobileItems = mainNavItems.slice(0, 5);

  let currentPath = $derived($page.url.pathname);

  function isActive(href: string): boolean {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(href);
  }
</script>

<!-- Mobile bottom nav -->
<nav
  class="
  lg:hidden fixed bottom-0 left-0 right-0 z-40
  bg-white border-t border-[#e5e7eb]
  flex items-center
  safe-area-inset-bottom
"
>
  {#each mobileItems as item}
    <a
      href={item.href}
      class="
        flex-1 flex flex-col items-center justify-center py-2.5 gap-1
        transition-colors duration-150
        {isActive(item.href) ? 'text-[#134e4a]' : 'text-[#9ca3af] hover:text-[#6b7280]'}
      "
    >
      <span class="w-5 h-5 flex items-center justify-center">
        <svelte:component this={item.icon} class="w-4 h-4"/>
      </span>
      <span
        class="text-[10px] font-medium leading-none truncate max-w-[52px] text-center
        {isActive(item.href) ? 'text-[#134e4a]' : 'text-[#9ca3af]'}"
      >
        {item.label}
      </span>

      {#if isActive(item.href)}
        <span class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#134e4a] rounded-b-full" />
      {/if}
    </a>
  {/each}
</nav>
