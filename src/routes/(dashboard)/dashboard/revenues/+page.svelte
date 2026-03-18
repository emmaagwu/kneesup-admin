<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import StatCard from '$components/dashboard/StatCard.svelte';
  import { formatCurrency, formatDate } from '$utils/helpers';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const revenueStats = $derived([
    {
      label: 'Total Revenue',
      value: formatCurrency(data.revenueStats.totalRevenue),
      change: 0,
      changeLabel: 'all time',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    },
    {
      label: 'Platform Fees (10%)',
      value: formatCurrency(data.revenueStats.totalFees),
      change: 0,
      changeLabel: 'all time',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`
    },
    {
      label: 'Host Payouts',
      value: formatCurrency(data.revenueStats.totalNet),
      change: 0,
      changeLabel: 'all time',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`
    },
    {
      label: 'Avg per Booking',
      value: formatCurrency(data.revenueStats.avgPerBooking),
      change: 0,
      changeLabel: 'all time',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`
    }
  ]);
</script>

<svelte:head>
  <title>Revenues — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Revenues' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div>
    <h1 class="text-xl font-bold text-[#111827]">Revenues</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">
      Platform-wide financial overview and transaction records.
      <span class="text-[#f59e0b]">Note: Platform fee is estimated at 10% — actual Stripe payouts require Stripe dashboard access.</span>
    </p>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {#each revenueStats as stat}
      <StatCard {...stat} />
    {/each}
  </div>

  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <div class="px-5 py-4 border-b border-[#f3f4f6]">
      <h2 class="font-semibold text-[#111827] text-sm">Transaction Records</h2>
      <p class="text-xs text-[#9ca3af] mt-0.5">Only accepted/completed reservations are shown</p>
    </div>
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Organization</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Venue</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Gross</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Fee (10%)</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Net</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each data.records as r}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4 font-medium text-[#374151]">{r.org}</td>
              <td class="px-4 py-4 text-[#6b7280]">{r.venue}</td>
              <td class="px-4 py-4 text-right text-[#111827] font-semibold">{formatCurrency(r.amount)}</td>
              <td class="px-4 py-4 text-right text-[#0d9488] font-medium">{formatCurrency(r.fee)}</td>
              <td class="px-4 py-4 text-right text-[#374151] font-semibold">{formatCurrency(r.net)}</td>
              <td class="px-5 py-4 text-[#9ca3af]">{formatDate(r.date)}</td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-5 py-8 text-center text-sm text-[#9ca3af]">No revenue records found.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <!-- Mobile -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each data.records as r}
        <div class="px-4 py-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-[#111827] text-sm">{r.org}</p>
              <p class="text-xs text-[#9ca3af]">{r.venue} · {formatDate(r.date)}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-[#111827]">{formatCurrency(r.amount)}</p>
              <p class="text-xs text-[#0d9488]">Fee: {formatCurrency(r.fee)}</p>
            </div>
          </div>
        </div>
      {:else}
        <p class="px-4 py-8 text-center text-sm text-[#9ca3af]">No revenue records found.</p>
      {/each}
    </div>
  </div>
</div>
