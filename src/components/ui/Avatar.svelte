<script lang="ts">
  import { getInitials } from '$utils/helpers';

  let {
    name = '',
    src = undefined,
    size = 'md'
  }: {
    name?: string;
    src?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
  } = $props();

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  let imgError = $state(false);
</script>

<div
  class="
  {sizes[size]}
  rounded-full flex items-center justify-center font-semibold shrink-0
  overflow-hidden bg-[#134e4a] text-white
"
>
  {#if src && !imgError}
    <img
      {src}
      alt={name}
      class="w-full h-full object-cover"
      onerror={() => (imgError = true)}
    />
  {:else}
    {getInitials(name)}
  {/if}
</div>