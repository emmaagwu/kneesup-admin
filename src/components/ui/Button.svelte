<script lang="ts">
  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    fullWidth = false,
    href = undefined,
    onclick,
    children
  }: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    href?: string;
    onclick?: () => void;
    children?: any;
  } = $props();

  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[#134e4a] hover:bg-[#0f3d3a] text-white focus:ring-[#0d9488] active:scale-[0.98]',
    secondary:
      'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#134e4a] border border-[#bbf7d0] focus:ring-[#0d9488]',
    ghost: 'bg-transparent hover:bg-[#f3f4f6] text-[#374151] focus:ring-[#d1d5db]',
    danger:
      'bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] focus:ring-[#f87171]',
    outline:
      'bg-white hover:bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] focus:ring-[#d1d5db]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
</script>

{#if href}
  <a
    {href}
    class="{base} {variants[variant]} {sizes[size]} {fullWidth ? 'w-full' : ''}"
    class:opacity-50={disabled}
    class:pointer-events-none={disabled}
  >
    {#if loading}
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    {/if}
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    {disabled}
    {onclick}
    class="{base} {variants[variant]} {sizes[size]} {fullWidth ? 'w-full' : ''}"
  >
    {#if loading}
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    {/if}
    {@render children?.()}
  </button>
{/if}