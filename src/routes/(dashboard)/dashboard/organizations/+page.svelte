<script lang="ts">
  import TopBar from '$lib/components/layout/TopBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate, formatCurrency } from '$lib/utils/helpers';

  type OrgStatus = 'active' | 'suspended' | 'pending';
  type StatusVariant = 'success' | 'error' | 'warning';

  interface Org {
    id: string;
    name: string;
    email: string;
    venueCount: number;
    revenue: number;
    status: OrgStatus;
    createdAt: string;
  }

  const statusMap: Record<OrgStatus, { label: string; variant: StatusVariant }> = {
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'error' },
    pending: { label: 'Pending', variant: 'warning' }
  };

  const orgs: Org[] = [
    { id: 'org-1', name: 'Lekki Events Co.', email: 'hello@lekkievents.com', venueCount: 48, revenue: 82000, status: 'active', createdAt: '2024-01-10' },
    { id: 'org-2', name: 'Lagos Spaces Ltd.', email: 'info@lagospaces.ng', venueCount: 34, revenue: 54000, status: 'active', createdAt: '2024-02-14' },
    { id: 'org-3', name: 'Abuja Venues Inc.', email: 'contact@abujav.com', venueCount: 22, revenue: 31000, status: 'active', createdAt: '2024-03-01' },
    { id: 'org-4', name: 'VIsland Events', email: 'vi@vislandevents.com', venueCount: 15, revenue: 19400, status: 'suspended', createdAt: '2024-01-28' },
    { id: 'org-5', name: 'PortHarcourt Hub', email: 'ph@phhub.ng', venueCount: 9, revenue: 8200, status: 'pending', createdAt: '2024-04-05' },
    { id: 'org-6', name: 'Kano Spaces', email: 'hello@kanospaces.ng', venueCount: 7, revenue: 4800, status: 'active', createdAt: '2024-05-20' }
  ];

  let search = '';
  let filterStatus: string = 'all';

  $: filtered = orgs.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
</script>

<svelte:head>
  <title>Organizations — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Organizations' }]}
  actions={[{ label: '+ New Organization', href: '/dashboard/organizations/new', variant: 'primary' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div>
    <h1 class="text-xl font-bold text-[#111827]">Organizations</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">Manage all venue organizations on the platform.</p>
  </div>

  <!-- Filters -->
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="relative flex-1">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search organizations..."
        bind:value={search}
        class="w-full pl-9 pr-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg
               focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
      />
    </div>
    <select
      bind:value={filterStatus}
      class="px-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg bg-white
             focus:outline-none focus:ring-2 focus:ring-[#0d9488] text-[#374151]"
    >
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="suspended">Suspended</option>
    </select>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <!-- Desktop table -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Organization</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Email</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Venues</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Revenue</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Joined</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as org}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <Avatar name={org.name} size="sm" />
                  <span class="font-medium text-[#111827]">{org.name}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-[#6b7280]">{org.email}</td>
              <td class="px-4 py-4 text-center text-[#374151] font-medium">{org.venueCount}</td>
              <td class="px-4 py-4 text-right font-semibold text-[#111827]">{formatCurrency(org.revenue)}</td>
              <td class="px-4 py-4 text-center">
                <Badge variant={statusMap[org.status].variant} dot>
                  {statusMap[org.status].label}
                </Badge>
              </td>
              <td class="px-4 py-4 text-[#9ca3af]">{formatDate(org.createdAt)}</td>
              <td class="px-5 py-4">
                <a href="/dashboard/organizations/{org.id}"
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
      {#each filtered as org}
        <a href="/dashboard/organizations/{org.id}"
           class="flex items-center gap-3 px-4 py-4 hover:bg-[#fafafa] transition-colors">
          <Avatar name={org.name} size="md" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-[#111827] truncate">{org.name}</p>
            <p class="text-xs text-[#9ca3af]">{org.venueCount} venues · {formatCurrency(org.revenue)}</p>
          </div>
          <Badge variant={statusMap[org.status].variant} size="sm">
            {statusMap[org.status].label}
          </Badge>
        </a>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div class="py-12 text-center">
        <p class="text-[#9ca3af] text-sm">No organizations match your search.</p>
      </div>
    {/if}
  </div>
</div>
