<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let search = $state('');
  let filterPeriod = $state('30days');
  let filterStatus = $state('all');

  // Real stats from Firestore data
  const stats = $derived([
    {
      label: 'All Reservations',
      value: data.reservations.length,
      change: '+12%',
      changeLabel: 'vs last week',
      status: 'positive'
    },
    {
      label: 'Active Reservations',
      value: data.reservations.filter(r => r.status === 'confirmed').length,
      change: '+12%',
      changeLabel: 'vs last week',
      status: 'positive'
    },
    {
      label: 'Completed Reservations',
      value: data.reservations.filter(r => r.status === 'completed').length,
      change: '+12%',
      changeLabel: 'vs last week',
      status: 'positive'
    },
    {
      label: 'Cancelled Reservations',
      value: data.reservations.filter(r => r.status === 'cancelled').length,
      change: '+5%',
      changeLabel: 'vs last week',
      status: 'negative'
    }
  ]);

  const reservations = data.reservations;

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'info' | 'error'> = {
      'completed': 'success',
      'confirmed': 'info',
      'cancelled': 'error',
      'pending': 'info'
    };
    return variants[status] || 'info';
  };

  let filtered = $derived(reservations.filter(r => {
    const matchSearch = search === '' || 
      r.guest.toLowerCase().includes(search.toLowerCase()) ||
      r.guestEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.org.toLowerCase().includes(search.toLowerCase()) ||
      r.venue.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  }));
</script>

<svelte:head>
  <title>Reservations — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Reservations', href: '/dashboard/reservations' }, { label: 'All Reservations' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold text-[#111827]">Reservations</h1>
  </div>

  <!-- Stat Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each stats as stat}
      <div class="bg-white rounded-xl border border-[#e5e7eb] p-5">
        <div class="flex items-start justify-between mb-3">
          <p class="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">{stat.label}</p>
          <svg class="w-4 h-4 text-[#d1d5db]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </div>
        <p class="text-3xl font-bold text-[#111827] mb-3">{stat.value}</p>
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span class={`text-xs font-medium ${stat.status === 'positive' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {stat.change}
          </span>
          <span class="text-xs text-[#9ca3af]">{stat.changeLabel}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Search and Filter -->
  <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
    <div class="relative w-full sm:w-64">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input 
        type="text" 
        placeholder="Search" 
        bind:value={search}
        class="w-full pl-9 pr-4 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" 
      />
    </div>
    
    <div class="flex gap-2">
      <button class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] hover:bg-[#fafafa] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Last 30 days
      </button>
      <button class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] hover:bg-[#fafafa] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-white border-b border-[#f3f4f6]">
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Client</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Location</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Date & Time</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Guest(s)</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Cost ($)</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as res (res.id)}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4">
                <div>
                  <p class="font-semibold text-[#111827]">{res.guest}</p>
                  <p class="text-xs text-[#9ca3af]">{res.guestEmail}</p>
                </div>
              </td>
              <td class="px-5 py-4">
                <p class="font-medium text-[#111827]">{res.org}</p>
                <p class="text-xs text-[#9ca3af]">{res.venue}</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-medium text-[#111827]">{res.date}</p>
                <p class="text-xs text-[#9ca3af]">{new Date(res.createdAt).toLocaleDateString()}</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-semibold text-[#111827]">-</p>
              </td>
              <td class="px-5 py-4">
                <p class="font-semibold text-[#111827]">${res.amount.toFixed(2)}</p>
              </td>
              <td class="px-5 py-4">
                <Badge variant={getStatusVariant(res.status)} dot>
                  {res.status}
                </Badge>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-5 py-8 text-center text-sm text-[#9ca3af]">No reservations found.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination -->
  <div class="flex items-center justify-between">
    <p class="text-sm text-[#9ca3af]">Showing 1-10 of 70</p>
    <div class="flex items-center gap-2">
      <button class="p-2 rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#fafafa] transition-colors" disabled>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button class="w-8 h-8 rounded-lg bg-[#0d9488] text-white text-xs font-semibold">1</button>
      <button class="w-8 h-8 rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#fafafa] text-xs font-semibold transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</div>