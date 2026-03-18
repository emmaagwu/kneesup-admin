<script lang="ts">
  import { goto } from '$app/navigation';
  import TopBar from '$components/layout/TopBar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // ── Types ────────────────────────────────────────────────────────
  type OrgStatus = 'active' | 'inactive' | 'blocked';
  type VenueStatus = 'active' | 'inactive';
  type ReservationStatus = 'active' | 'inactive';
  type MemberStatus = 'active' | 'inactive';
  type Tab = 'venues' | 'reservations' | 'team' | 'activity';

  interface OrgVenue {
    id: string; name: string; address: string; spaces: number; rating: number; status: VenueStatus;
  }
  interface OrgReservation {
    id: string; client: string; email: string; venue: string; space: string;
    cost: string; dateTime: string; duration: string; status: ReservationStatus;
  }
  interface OrgMember {
    id: string; name: string; email: string; role: string; dateJoined: string; status: MemberStatus;
  }
  interface OrgActivity {
    id: string; name: string; email: string; role: string; dateJoined: string; status: MemberStatus;
  }
  interface OrgDetail {
    id: string; name: string; ownerName: string; ownerEmail: string; ownerTitle: string;
    venueCount: number; reservationCount: number; revenue: string; teamCount: number;
    status: OrgStatus;
    venues: OrgVenue[]; reservations: OrgReservation[]; team: OrgMember[]; activity: OrgActivity[];
  }

  // ── State ─────────────────────────────────────────────────────────
  let activeTab = $state<Tab>('venues');
  let showBlockModal = $state(false);
  let activeMenu = $state<string | null>(null);

  // Build the org object in the exact shape your markup expects
  let org = $derived<OrgDetail>({
    id: data.organization.id,
    name: data.organization.name,

    ownerName: data.owner?.name ?? '—',
    ownerEmail: data.owner?.email ?? data.organization.email ?? '—',
    ownerTitle: data.owner?.role ?? '—', // "Owner" from orgMembers[].userRole

    venueCount: data.venues.length,
    reservationCount: data.reservationCount,
    revenue: data.revenue,
    teamCount: data.team.length,

    status: (data.organization.status as OrgStatus) ?? 'active',

    venues: data.venues as OrgVenue[],
    reservations: data.reservations as unknown as OrgReservation[],

    // team now includes name + dateJoined from server hydration
    team: data.team as OrgMember[],
    activity: data.activity as OrgActivity[]
  });

  // ── Helpers ───────────────────────────────────────────────────────
  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function getAvatarColor(name: string) {
    const colors = ['bg-[#3b82f6]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#f59e0b]', 'bg-[#10b981]', 'bg-[#134e4a]'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  const statusColors: Record<string, string> = {
    active:   'text-[#16a34a]',
    inactive: 'text-[#d97706]',
    blocked:  'text-[#dc2626]',
  };

  const statusBadgeClass: Record<string, string> = {
    active:   'text-[#16a34a] bg-[#f0fdf4]',
    inactive: 'text-[#d97706] bg-[#fffbeb]',
    blocked:  'text-[#dc2626] bg-[#fef2f2]',
  };

  function confirmBlock() {
    showBlockModal = false;
    // TODO: call API
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'venues',       label: 'Venues' },
    { key: 'reservations', label: 'Reservations' },
    { key: 'team',         label: 'Team members' },
    { key: 'activity',     label: 'Activity' },
  ];

  function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  }
</script>

<svelte:head>
  <title>{org.name} — KneesUp Admin</title>
</svelte:head>

<!-- Block confirm modal backdrop -->
{#if showBlockModal}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
       onclick={() => showBlockModal = false}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-[300px] p-6 relative"
         onclick={(e) => e.stopPropagation()}>
      <button onclick={() => showBlockModal = false}
              class="absolute top-4 right-4 text-[#9ca3af] hover:text-[#374151] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Icon -->
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-full bg-[#fef2f2] flex items-center justify-center">
          <div class="w-9 h-9 rounded-full border-2 border-[#dc2626] flex items-center justify-center">
            <span class="text-[#dc2626] text-lg font-bold leading-none">!</span>
          </div>
        </div>
      </div>

      <h3 class="text-center text-base font-bold text-[#111827] mb-2">Are you sure?</h3>
      <p class="text-center text-xs text-[#6b7280] leading-relaxed mb-6">
        By blocking this organization, user will not be able to accept or receive any reservation request.
      </p>

      <div class="flex gap-3">
        <button onclick={() => showBlockModal = false}
                class="flex-1 py-2.5 rounded-lg border border-[#e5e7eb] text-sm font-semibold
                       text-[#374151] hover:bg-[#f9fafb] transition-colors">
          Cancel
        </button>
        <button onclick={confirmBlock}
                class="flex-1 py-2.5 rounded-lg bg-[#dc2626] text-white text-sm font-semibold
                       hover:bg-[#b91c1c] transition-colors">
          Block
        </button>
      </div>
    </div>
  </div>
{/if}

<TopBar
  breadcrumbs={[
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: 'Organization Details', href: '/dashboard/organizations' },
    { label: org.name }
  ]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px]">

  <!-- ── Header card ──────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] px-5 sm:px-6 py-5">
    <div class="flex items-start justify-between gap-4">

      <!-- Left: avatar + name + status -->
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full {getAvatarColor(org.name)}
                    flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
          {getInitials(org.name)}
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-[#111827]">{org.name}</h1>
          <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full {statusBadgeClass[org.status]}">
            {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
          </span>
        </div>
      </div>

      <!-- Right: Edit + Block buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <button class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold
                       border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <span class="hidden sm:inline">Edit</span>
        </button>
        <button onclick={() => showBlockModal = true}
                class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold
                       border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          <span class="hidden sm:inline">Block</span>
        </button>
      </div>
    </div>

    <!-- Owner details -->
    <div class="mt-5 pt-5 border-t border-[#f3f4f6]">
      <p class="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Owner's Details</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Name</p>
          <p class="text-sm font-semibold text-[#111827]">{org.ownerName}</p>
        </div>
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Email Address</p>
          <p class="text-sm text-[#111827]">{org.ownerEmail}</p>
        </div>
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Title/Position</p>
          <p class="text-sm font-semibold text-[#111827]">{org.ownerTitle}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Summary stats ─────────────────────────────────────────── -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {#each [
      { label: 'VENUES',             value: org.venueCount,      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
      { label: 'RESERVATIONS',       value: org.reservationCount, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` },
      { label: 'TOTAL GROSS REVENUE',value: org.revenue,          icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
      { label: 'TEAM MEMBERS',       value: org.teamCount,        icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    ] as stat}
      <div class="bg-white rounded-xl border border-[#e5e7eb] p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[#9ca3af] leading-tight">
            {stat.label}
          </span>
          <div class="w-7 h-7 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] shrink-0">
            {@html stat.icon}
          </div>
        </div>
        <div class="text-2xl sm:text-[1.75rem] font-bold text-[#111827] leading-none">
          {stat.value}
        </div>
      </div>
    {/each}
  </div>

  <!-- ── Tabs ──────────────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">

    <!-- Tab nav -->
    <div class="flex border-b border-[#f0f0f0] overflow-x-auto">
      {#each tabs as tab}
        <button
          onclick={() => activeTab = tab.key}
          class="px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2
                 {activeTab === tab.key
                   ? 'border-[#134e4a] text-[#134e4a]'
                   : 'border-transparent text-[#6b7280] hover:text-[#374151]'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab toolbar -->
    <div class="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-[#f9fafb]">
      <div class="relative max-w-xs">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="search" placeholder="Search"
               class="pl-8 pr-4 py-1.5 text-xs rounded-lg border border-[#e5e7eb] w-48
                      focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                      placeholder:text-[#9ca3af]"/>
      </div>
      <div class="flex items-center gap-2 sm:ml-auto">
        <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3 h-3 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Last 30 days
        </button>
        <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3 h-3 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
          </svg>
          Filter
        </button>
      </div>
    </div>

    <!-- ── VENUES TAB ─────────────────────────────────────────── -->
    {#if activeTab === 'venues'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Name</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Address</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">No. of Spaces</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Ratings</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each org.venues as venue}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{venue.name}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] max-w-[260px]">{venue.address}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{venue.spaces}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{venue.rating}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full
                               {venue.status === 'active'
                                 ? 'bg-[#f0fdf4] text-[#16a34a]'
                                 : 'bg-[#fffbeb] text-[#d97706]'}">
                    {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <button class="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{org.venues.length} of {org.venueCount}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- ── RESERVATIONS TAB ───────────────────────────────────── -->
    {#if activeTab === 'reservations'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Client</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Email</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Venue</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Space</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Cost ($)</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Date & Time</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Duration</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each org.reservations as res}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{res.client}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{res.email}</td>
                <td class="px-4 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{res.venue}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{res.space}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{res.cost}</td>
                <td class="px-4 py-4 text-xs text-[#6b7280] whitespace-nowrap">{res.dateTime}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{res.duration}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full
                               {res.status === 'active'
                                 ? 'bg-[#f0fdf4] text-[#16a34a]'
                                 : 'bg-[#fffbeb] text-[#d97706]'}">
                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{org.reservations.length} of {org.reservationCount}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- ── TEAM MEMBERS TAB ───────────────────────────────────── -->
    {#if activeTab === 'team'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Name</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Email</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Role</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Date Joined</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each org.team as member}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{member.name}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280]">{member.email}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{member.role}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{formatDate(member.dateJoined)}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full
                               {member.status === 'active'
                                 ? 'bg-[#f0fdf4] text-[#16a34a]'
                                 : 'bg-[#fffbeb] text-[#d97706]'}">
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{org.team.length} of {org.team.length}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- ── ACTIVITY TAB ───────────────────────────────────────── -->
    {#if activeTab === 'activity'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Name</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Email</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Role</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Date Joined</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each org.activity as item}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{item.name}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280]">{item.email}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{item.role}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{item.dateJoined}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full
                               {item.status === 'active'
                                 ? 'bg-[#f0fdf4] text-[#16a34a]'
                                 : 'bg-[#fffbeb] text-[#d97706]'}">
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{org.activity.length} of {org.activity.length}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    {/if}

  </div>
</div>