<script lang="ts">
  import TopBar from '$lib/components/layout/TopBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/helpers';

  type VenueStatus = 'active' | 'inactive' | 'pending';
  type StatusVariant = 'success' | 'neutral' | 'warning';

  interface Venue {
    id: string;
    name: string;
    organization: string;
    address: string;
    capacity: number;
    pricePerHour: number;
    status: VenueStatus;
    rating: number;
    createdAt: string;
  }

  const statusMap: Record<VenueStatus, { label: string; variant: StatusVariant }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'neutral' },
    pending: { label: 'Pending', variant: 'warning' }
  };

  const venues: Venue[] = [
    { id: 'v-1', name: 'The Grand Hall', organization: 'Lekki Events Co.', address: 'Lekki Phase 1, Lagos', capacity: 500, pricePerHour: 80, status: 'active', rating: 4.8, createdAt: '2024-01-15' },
    { id: 'v-2', name: 'Sunset Rooftop', organization: 'Lagos Spaces Ltd.', address: 'Victoria Island, Lagos', capacity: 150, pricePerHour: 60, status: 'active', rating: 4.6, createdAt: '2024-02-01' },
    { id: 'v-3', name: 'Garden Pavilion', organization: 'Abuja Venues Inc.', address: 'Maitama, Abuja', capacity: 200, pricePerHour: 45, status: 'active', rating: 4.5, createdAt: '2024-03-10' },
    { id: 'v-4', name: 'Waterfront Deck', organization: 'VIsland Events', address: 'V/Island, Lagos', capacity: 80, pricePerHour: 70, status: 'inactive', rating: 4.2, createdAt: '2024-01-28' },
    { id: 'v-5', name: 'The Loft Studio', organization: 'Lekki Events Co.', address: 'Lekki Phase 2, Lagos', capacity: 60, pricePerHour: 35, status: 'active', rating: 4.7, createdAt: '2024-04-05' },
    { id: 'v-6', name: 'Heritage Hall', organization: 'PortHarcourt Hub', address: 'GRA, Port Harcourt', capacity: 300, pricePerHour: 55, status: 'pending', rating: 0, createdAt: '2024-05-22' }
  ];

  let search = '';
  let filterStatus = 'all';

  $: filtered = venues.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.organization.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });
</script>

<svelte:head>
  <title>Venues — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Venues' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div>
    <h1 class="text-xl font-bold text-[#111827]">Venues</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">All listed venues across the platform.</p>
  </div>

  <div class="flex flex-col sm:flex-row gap-3">
    <div class="relative flex-1">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" placeholder="Search venues..." bind:value={search}
        class="w-full pl-9 pr-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
    </div>
    <select bind:value={filterStatus}
      class="px-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] text-[#374151]">
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="pending">Pending</option>
    </select>
  </div>

  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Venue</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Organization</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Address</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Capacity</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Price/hr</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Rating</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as venue}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4 font-medium text-[#111827]">{venue.name}</td>
              <td class="px-4 py-4 text-[#6b7280]">{venue.organization}</td>
              <td class="px-4 py-4 text-[#9ca3af] text-xs">{venue.address}</td>
              <td class="px-4 py-4 text-center text-[#374151]">{venue.capacity}</td>
              <td class="px-4 py-4 text-right font-semibold text-[#111827]">{formatCurrency(venue.pricePerHour)}</td>
              <td class="px-4 py-4 text-center">
                {#if venue.rating > 0}
                  <span class="flex items-center justify-center gap-1 text-[#f59e0b] font-medium text-xs">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {venue.rating}
                  </span>
                {:else}
                  <span class="text-[#d1d5db] text-xs">—</span>
                {/if}
              </td>
              <td class="px-4 py-4 text-center">
                <Badge variant={statusMap[venue.status].variant} dot>
                  {statusMap[venue.status].label}
                </Badge>
              </td>
              <td class="px-5 py-4">
                <a href="/dashboard/venues/{venue.id}"
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
      {#each filtered as venue}
        <a href="/dashboard/venues/{venue.id}"
           class="block px-4 py-4 hover:bg-[#fafafa] transition-colors">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium text-[#111827]">{venue.name}</p>
              <p class="text-xs text-[#9ca3af] mt-0.5">{venue.organization}</p>
              <p class="text-xs text-[#9ca3af]">{venue.address}</p>
            </div>
            <div class="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={statusMap[venue.status].variant} size="sm">
                {statusMap[venue.status].label}
              </Badge>
              <span class="text-sm font-semibold text-[#111827]">{formatCurrency(venue.pricePerHour)}/hr</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

// change the venues page to use the admin team layout
