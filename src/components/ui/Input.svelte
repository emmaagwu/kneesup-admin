<script lang="ts">
  export let label = '';
  export let type: 'text' | 'email' | 'password' | 'number' | 'search' = 'text';
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let id = label.toLowerCase().replace(/\s+/g, '-');
  export let required = false;
  export let disabled = false;
  export let icon: string | undefined = undefined;
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label for={id} class="text-sm font-medium text-[#374151]">
      {label}
      {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    {#if icon}
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
        aria-hidden="true"
      >
        {@html icon}
      </span>
    {/if}

    <input
      {id}
      {type}
      {placeholder}
      {required}
      {disabled}
      bind:value
      on:input
      on:change
      on:blur
      on:focus
      class="
        w-full rounded-lg border text-sm text-[#111827] placeholder:text-[#9ca3af]
        bg-white transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
        disabled:bg-[#f9fafb] disabled:cursor-not-allowed
        {error ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb] hover:border-[#d1d5db]'}
        {icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5'}
      "
    />
  </div>

  {#if error}
    <p class="text-xs text-red-500 mt-0.5">{error}</p>
  {/if}
</div>
