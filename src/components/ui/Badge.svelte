<script lang="ts">
  let {
    variant = 'neutral',
    size = 'md',
    dot = false,
    children
  }: {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    dot?: boolean;
    children?: any;
  } = $props();

  const variants = {
    success: 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]',
    warning: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
    error: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
    info: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    neutral: 'bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]'
  };

  const dotColors = {
    success: 'bg-[#16a34a]',
    warning: 'bg-[#d97706]',
    error: 'bg-[#dc2626]',
    info: 'bg-[#2563eb]',
    neutral: 'bg-[#9ca3af]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };
</script>

<span
  class="inline-flex items-center gap-1.5 font-medium rounded-full border {variants[variant]} {sizes[size]}"
>
  {#if dot}
    <span class="w-1.5 h-1.5 rounded-full {dotColors[variant]}" />
  {/if}
  {@render children?.()}
</span>