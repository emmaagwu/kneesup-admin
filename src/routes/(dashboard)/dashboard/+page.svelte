<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import StatCard from '$components/dashboard/StatCard.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { formatCurrency, formatDate } from '$utils/helpers';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let user = $derived($authStore.user);

  // ── Real stats from Firestore ─────────────────────────────────────────────
  const stats = $derived([
    {
      label: 'Total Gross Revenue',
      value: formatCurrency(data.stats.totalGrossRevenue),
      change: 0,
      changeLabel: 'vs last week',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    },
    {
      label: 'Total Reservations',
      value: data.stats.totalReservations.toLocaleString(),
      change: 0,
      changeLabel: 'vs last week',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
    },
    {
      label: 'All Organizations',
      value: data.stats.totalOrganizations.toLocaleString(),
      change: 0,
      changeLabel: 'vs last week',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
    },
    {
      label: 'Venues',
      value: data.stats.totalVenues.toLocaleString(),
      change: 0,
      changeLabel: 'vs last week',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
    }
  ]);

  type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

  const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
    confirmed: { label: 'Confirmed', variant: 'success' },
    pending:   { label: 'Pending',   variant: 'warning' },
    completed: { label: 'Completed', variant: 'info' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    active:    { label: 'Active',    variant: 'success' },
    suspended: { label: 'Suspended', variant: 'error' }
  };
</script>

<svelte:head>
  <title>Dashboard — KneesUp Admin</title>
</svelte:head>

<!-- Top bar with page actions -->
<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

  <!-- Greeting -->
  <div class="flex items-center justify-between">
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
      Hello, {user?.displayName?.split(' ')[0] ?? 'Admin'}
      <span class="text-2xl" role="img" aria-label="wave">👋</span>
    </h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">
      Here's what's happening on the platform today.
    </p>
  </div>

  <!-- Action buttons — right aligned on all screens -->
  <div class="flex items-center gap-2 shrink-0">
    <a
      href="/dashboard/admin-team/new"
      class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
             bg-[#477a79] text-white hover:bg-[#477a60] transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span class="hidden sm:inline">New Admin</span>
    </a>
    <a
      href="/dashboard/organizations"
      class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
             bg-[#213243] text-white hover:bg-[#213230] transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span class="hidden sm:inline">New Organization</span>
    </a>
  </div>
</div>

  <!-- Stat Cards — real data -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {#each stats as stat}
      <StatCard
        label={stat.label}
        value={stat.value}
        change={stat.change}
        changeLabel={stat.changeLabel}
        icon={stat.icon}
      />
    {/each}
  </div>

  <!-- Main content grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

    <!-- Recent Reservations (2/3 width) -->
    <div class="lg:col-span-2 bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div class="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-[#111827] text-sm">Recent Reservations</h2>
          <p class="text-xs text-[#9ca3af] mt-0.5">Latest bookings across all venues</p>
        </div>
        <a
          href="/dashboard/reservations"
          class="text-xs font-medium text-[#0d9488] hover:text-[#0f766e] transition-colors"
        >
          View all →
        </a>
      </div>

      <!-- Table: desktop -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f3f4f6]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] tracking-wide uppercase">Guest</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] tracking-wide uppercase">Venue</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] tracking-wide uppercase">Date</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] tracking-wide uppercase">Amount</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-[#9ca3af] tracking-wide uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each data.recentReservations as res}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <Avatar name={res.guest} size="xs" />
                    <div>
                      <p class="font-medium text-[#111827] text-sm">{res.guest}</p>
                      <p class="text-[11px] text-[#9ca3af]">{res.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3.5">
                  <p class="text-[#374151] text-sm">{res.venue}</p>
                  <p class="text-[11px] text-[#9ca3af]">{res.org}</p>
                </td>
                <td class="px-4 py-3.5 text-sm text-[#6b7280]">{formatDate(res.date)}</td>
                <td class="px-4 py-3.5 text-right font-semibold text-[#111827] text-sm">
                  {formatCurrency(res.amount)}
                </td>
                <td class="px-5 py-3.5 text-right">
                  <Badge variant={statusMap[res.status].variant} dot>
                    {statusMap[res.status].label}
                  </Badge>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="5" class="px-5 py-8 text-center text-sm text-[#9ca3af]">
                  No reservations yet.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile: card list -->
      <div class="sm:hidden divide-y divide-[#f9fafb]">
        {#each data.recentReservations as res}
          <div class="px-4 py-3.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <Avatar name={res.guest} size="sm" />
              <div class="min-w-0">
                <p class="font-medium text-[#111827] text-sm truncate">{res.guest}</p>
                <p class="text-[11px] text-[#9ca3af] truncate">{res.venue} · {formatDate(res.date)}</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="text-sm font-semibold text-[#111827]">{formatCurrency(res.amount)}</span>
              <Badge variant={statusMap[res.status].variant} size="sm">
                {statusMap[res.status].label}
              </Badge>
            </div>
          </div>
        {:else}
          <p class="px-4 py-8 text-center text-sm text-[#9ca3af]">No reservations yet.</p>
        {/each}
      </div>
    </div>

    <!-- Top Organizations (1/3 width) — real data -->
    <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div class="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-[#111827] text-sm">Top Organizations</h2>
          <p class="text-xs text-[#9ca3af] mt-0.5">By total revenue</p>
        </div>
        <a
          href="/dashboard/organizations"
          class="text-xs font-medium text-[#0d9488] hover:text-[#0f766e] transition-colors"
        >
          View all →
        </a>
      </div>

      <div class="divide-y divide-[#f9fafb]">
        {#each data.topOrganizations as org, i}
          <div class="px-5 py-3.5 flex items-center gap-3 hover:bg-[#fafafa] transition-colors">
            <span
              class="w-6 h-6 rounded-full bg-[#f3f4f6] text-[#9ca3af] text-xs font-bold
                     flex items-center justify-center shrink-0"
            >
              {i + 1}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[#111827] truncate">{org.name}</p>
              <p class="text-[11px] text-[#9ca3af]">{org.venues} venues</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-[#111827]">{formatCurrency(org.revenue)}</p>
              <Badge variant={statusMap[org.status]?.variant ?? 'neutral'} size="sm">
                {statusMap[org.status]?.label ?? org.status}
              </Badge>
            </div>
          </div>
        {:else}
          <p class="px-5 py-8 text-center text-sm text-[#9ca3af]">No organizations yet.</p>
        {/each}
      </div>
    </div>
  </div>

  <!-- Bottom row: Quick actions -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

    <!-- Quick actions -->
    {#each [
      { label: 'New Organization', href: '/dashboard/organizations', icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`, color: 'bg-[#f0fdf4] text-[#15803d]' },
      { label: 'Add Admin', href: '/dashboard/admin-team/new', icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>`, color: 'bg-[#eff6ff] text-[#2563eb]' },
      { label: 'View Revenue', href: '/dashboard/revenues', icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`, color: 'bg-[#fefce8] text-[#ca8a04]' },
      { label: 'Audit Log', href: '/dashboard/audit-log', icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`, color: 'bg-[#fdf4ff] text-[#9333ea]' }
    ] as action}
      <a
        href={action.href}
        class="bg-white rounded-xl border border-[#e5e7eb] p-5
               flex items-center gap-4 hover:shadow-sm hover:border-[#d1d5db]
               transition-all duration-200 group"
      >
        <div class="w-10 h-10 rounded-lg {action.color} flex items-center justify-center shrink-0">
          {@html action.icon}
        </div>
        <span class="font-medium text-sm text-[#374151] group-hover:text-[#111827] transition-colors">
          {action.label}
        </span>
        <svg
          class="w-4 h-4 text-[#d1d5db] group-hover:text-[#9ca3af] ml-auto transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    {/each}
  </div>
</div>
