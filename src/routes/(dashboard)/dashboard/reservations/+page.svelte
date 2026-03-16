<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/helpers';

  type ResStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
  type StatusVariant = 'success' | 'warning' | 'info' | 'error';

  const statusMap: Record<ResStatus, { label: string; variant: StatusVariant }> = {
    confirmed: { label: 'Confirmed', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    completed: { label: 'Completed', variant: 'info' },
    cancelled: { label: 'Cancelled', variant: 'error' }
  };

  const reservations = [
    { id: 'RES-001', guest: 'Adeola Martins', email: 'adeola@email.com', venue: 'The Grand Hall', org: 'Lekki Events Co.', date: '2025-03-14', amount: 450, status: 'confirmed' as ResStatus },
    { id: 'RES-002', guest: 'Chukwuemeka Obi', email: 'chukwu@email.com', venue: 'Sunset Rooftop', org: 'Lagos Spaces Ltd.', date: '2025-03-13', amount: 320, status: 'pending' as ResStatus },
    { id: 'RES-003', guest: 'Fatima Bello', email: 'fatima@email.com', venue: 'Garden Pavilion', org: 'Abuja Venues Inc.', date: '2025-03-12', amount: 180, status: 'completed' as ResStatus },
    { id: 'RES-004', guest: 'Seun Adeyemi', email: 'seun@email.com', venue: 'Waterfront Deck', org: 'VIsland Events', date: '2025-03-11', amount: 600, status: 'cancelled' as ResStatus },
    { id: 'RES-005', guest: 'Ngozi Okafor', email: 'ngozi@email.com', venue: 'The Loft Studio', org: 'Lekki Events Co.', date: '2025-03-10', amount: 240, status: 'confirmed' as ResStatus },
    { id: 'RES-006', guest: 'Emeka Nwosu', email: 'emeka@email.com', venue: 'Heritage Hall', org: 'PortHarcourt Hub', date: '2025-03-09', amount: 380, status: 'completed' as ResStatus }
  ];

  let search = '';
  let filterStatus = 'all';

  $: filtered = reservations.filter(r => {
    const matchSearch = r.guest.toLowerCase().includes(search.toLowerCase()) ||
      r.venue.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  $: totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);
</script>

<svelte:head>
  <title>Reservations — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reservations' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-xl font-bold text-[#111827]">Reservations</h1>
      <p class="text-sm text-[#9ca3af] mt-0.5">All bookings across every venue on the platform.</p>
    </div>
    <div class="hidden sm:block text-right">
      <p class="text-sm text-[#9ca3af]">Total shown</p>
      <p class="text-lg font-bold text-[#111827]">{formatCurrency(totalAmount)}</p>
    </div>
  </div>

  <div class="flex flex-col sm:flex-row gap-3">
    <div class="relative flex-1">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" placeholder="Search by guest, venue or ID..." bind:value={search}
        class="w-full pl-9 pr-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
    </div>
    <select bind:value={filterStatus}
      class="px-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] text-[#374151]">
      <option value="all">All Status</option>
      <option value="confirmed">Confirmed</option>
      <option value="pending">Pending</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>

  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Guest</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Venue / Org</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Amount</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as res}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-2.5">
                  <Avatar name={res.guest} size="xs" />
                  <div>
                    <p class="font-medium text-[#111827]">{res.guest}</p>
                    <p class="text-[11px] text-[#9ca3af]">{res.id}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <p class="text-[#374151]">{res.venue}</p>
                <p class="text-[11px] text-[#9ca3af]">{res.org}</p>
              </td>
              <td class="px-4 py-4 text-[#6b7280]">{formatDate(res.date)}</td>
              <td class="px-4 py-4 text-right font-semibold text-[#111827]">{formatCurrency(res.amount)}</td>
              <td class="px-4 py-4 text-center">
                <Badge variant={statusMap[res.status].variant} dot>
                  {statusMap[res.status].label}
                </Badge>
              </td>
              <td class="px-5 py-4">
                <a href="/dashboard/reservations/{res.id}"
                   class="text-xs font-medium text-[#0d9488] hover:text-[#0f766e] transition-colors">
                  View →
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each filtered as res}
        <a href="/dashboard/reservations/{res.id}"
           class="flex items-center gap-3 px-4 py-4 hover:bg-[#fafafa] transition-colors">
          <Avatar name={res.guest} size="sm" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-[#111827] truncate">{res.guest}</p>
            <p class="text-xs text-[#9ca3af]">{res.venue} · {formatDate(res.date)}</p>
          </div>
          <div class="flex flex-col items-end gap-1 shrink-0">
            <span class="text-sm font-semibold text-[#111827]">{formatCurrency(res.amount)}</span>
            <Badge variant={statusMap[res.status].variant} size="sm">
              {statusMap[res.status].label}
            </Badge>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>
