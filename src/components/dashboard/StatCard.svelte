<script lang="ts">
  let {
    label = '',
    value = '',
    change = 0,
    changeLabel = 'vs last week',
    icon = ''
  }: {
    label?: string;
    value?: string | number;
    change?: number;
    changeLabel?: string;
    icon?: string;
  } = $props();

  let isPositive = $derived(change >= 0);
</script>

<div
  class="bg-white rounded-xl border border-[#e5e7eb] p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow duration-200"
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <span class="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af]">
      {label}
    </span>
    <div class="w-8 h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
      {@html icon}
    </div>
  </div>

  <!-- Value -->
  <div class="text-[1.75rem] font-bold text-[#111827] leading-none tracking-tight">
    {value}
  </div>

  <!-- Footer -->
  <div class="flex items-center gap-1.5">
    <div
      class="flex items-center gap-0.5 text-xs font-semibold {isPositive
        ? 'text-[#16a34a]'
        : 'text-[#dc2626]'}"
    >
      {#if isPositive}
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      {:else}
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      {/if}
      {isPositive ? '+' : ''}{change}%
    </div>
    <span class="text-xs text-[#9ca3af]">{changeLabel}</span>
  </div>
</div>