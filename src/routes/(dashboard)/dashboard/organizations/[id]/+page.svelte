<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import type { PageData } from './$types';

  type ActionResult = {
    successMessage?: string;
    errorMessage?: string;
  };

  let { data, form }: { data: PageData; form?: ActionResult } = $props();

  // ── Types ────────────────────────────────────────────────────────
  type OrgStatus = 'active' | 'inactive' | 'blocked';
  type VenueStatus = 'active' | 'inactive';
  type ReservationStatus = 'active' | 'inactive';
  type MemberStatus = 'active' | 'inactive';
  type Tab = 'venues' | 'reservations' | 'team' | 'activity';

  interface OrgVenue {
    id: string; name: string; address: string; spaces: number; rating: number; status: VenueStatus; createdAt: string;
  }
  interface OrgReservation {
    id: string; client: string; email: string; venue: string; space: string;
    cost: string; dateTime: string; createdAt: string; duration: string; status: ReservationStatus;
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

  type ViewMode = 'recent' | 'oldest' | 'last30' | 'last90' | 'name_asc' | 'name_desc' | 'status_active' | 'status_inactive';

  // ── State ─────────────────────────────────────────────────────────
  let activeTab = $state<Tab>('venues');
  let showBlockModal = $state(false);
  let showEditModal = $state(false);
  let editName = $state('');
  let editOwnerName = $state('');
  let editOwnerEmail = $state('');
  let editOwnerTitle = $state('Owner');
  let editOwnerUserId = $state('');
  let search = $state('');
  let viewMode = $state<ViewMode>('recent');

  const stats = [
    { key: 'venues', label: 'VENUES', value: () => org.venueCount, icon: 'venues' as const },
    { key: 'reservations', label: 'RESERVATIONS', value: () => org.reservationCount, icon: 'reservations' as const },
    { key: 'revenue', label: 'TOTAL GROSS REVENUE', value: () => org.revenue, icon: 'revenue' as const },
    { key: 'team', label: 'TEAM MEMBERS', value: () => org.teamCount, icon: 'team' as const }
  ] as const;

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

  const statusBadgeClass: Record<string, string> = {
    active:   'text-[#16a34a] bg-[#f0fdf4]',
    inactive: 'text-[#d97706] bg-[#fffbeb]',
    blocked:  'text-[#dc2626] bg-[#fef2f2]',
  };

  const TAB_DEFAULT_VIEW: Record<Tab, ViewMode> = {
    venues: 'recent',
    reservations: 'recent',
    team: 'recent',
    activity: 'recent'
  };

  function setTab(tab: Tab) {
    activeTab = tab;
    viewMode = TAB_DEFAULT_VIEW[tab];
  }

  function parseDate(value: string) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function isWithinLastDays(value: string, days: number) {
    const d = parseDate(value);
    if (!d) return false;
    return d.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
  }

  function getRecencyValue(value: string) {
    const d = parseDate(value);
    return d ? d.getTime() : 0;
  }

  let viewOptions = $derived.by(() => {
    if (activeTab === 'venues') {
      return [
        { value: 'recent', label: 'Most Recent' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'name_asc', label: 'Name A-Z' },
        { value: 'name_desc', label: 'Name Z-A' },
        { value: 'status_active', label: 'Status: Active' },
        { value: 'status_inactive', label: 'Status: Inactive' }
      ] as Array<{ value: ViewMode; label: string }>;
    }

    return [
      { value: 'recent', label: 'Most Recent' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'last30', label: 'Last 30 Days' },
      { value: 'last90', label: 'Last 90 Days' },
      { value: 'name_asc', label: 'Name A-Z' },
      { value: 'name_desc', label: 'Name Z-A' },
      { value: 'status_active', label: 'Status: Active' },
      { value: 'status_inactive', label: 'Status: Inactive' }
    ] as Array<{ value: ViewMode; label: string }>;
  });

  let visibleVenues = $derived.by(() => {
    let rows = [...org.venues];
    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.name.toLowerCase().includes(query) ||
        row.address.toLowerCase().includes(query)
      );
    }

    if (viewMode === 'status_active') rows = rows.filter((row) => row.status === 'active');
    if (viewMode === 'status_inactive') rows = rows.filter((row) => row.status === 'inactive');
    if (viewMode === 'last30') rows = rows.filter((row) => isWithinLastDays(row.createdAt, 30));
    if (viewMode === 'last90') rows = rows.filter((row) => isWithinLastDays(row.createdAt, 90));

    if (viewMode === 'name_asc') rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (viewMode === 'name_desc') rows.sort((a, b) => b.name.localeCompare(a.name));
    else if (viewMode === 'oldest') rows.sort((a, b) => getRecencyValue(a.createdAt) - getRecencyValue(b.createdAt));
    else rows.sort((a, b) => getRecencyValue(b.createdAt) - getRecencyValue(a.createdAt));

    return rows;
  });

  let visibleReservations = $derived.by(() => {
    let rows = [...org.reservations];
    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.client.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.venue.toLowerCase().includes(query) ||
        row.space.toLowerCase().includes(query)
      );
    }

    if (viewMode === 'status_active') rows = rows.filter((row) => row.status === 'active');
    if (viewMode === 'status_inactive') rows = rows.filter((row) => row.status === 'inactive');
    if (viewMode === 'last30') rows = rows.filter((row) => isWithinLastDays(row.createdAt, 30));
    if (viewMode === 'last90') rows = rows.filter((row) => isWithinLastDays(row.createdAt, 90));

    if (viewMode === 'name_asc') rows.sort((a, b) => a.client.localeCompare(b.client));
    else if (viewMode === 'name_desc') rows.sort((a, b) => b.client.localeCompare(a.client));
    else if (viewMode === 'oldest') rows.sort((a, b) => getRecencyValue(a.createdAt) - getRecencyValue(b.createdAt));
    else rows.sort((a, b) => getRecencyValue(b.createdAt) - getRecencyValue(a.createdAt));

    return rows;
  });

  let visibleTeam = $derived.by(() => {
    let rows = [...org.team];
    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query)
      );
    }

    if (viewMode === 'status_active') rows = rows.filter((row) => row.status === 'active');
    if (viewMode === 'status_inactive') rows = rows.filter((row) => row.status === 'inactive');
    if (viewMode === 'last30') rows = rows.filter((row) => isWithinLastDays(row.dateJoined, 30));
    if (viewMode === 'last90') rows = rows.filter((row) => isWithinLastDays(row.dateJoined, 90));

    if (viewMode === 'name_asc') rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (viewMode === 'name_desc') rows.sort((a, b) => b.name.localeCompare(a.name));
    else if (viewMode === 'oldest') rows.sort((a, b) => getRecencyValue(a.dateJoined) - getRecencyValue(b.dateJoined));
    else rows.sort((a, b) => getRecencyValue(b.dateJoined) - getRecencyValue(a.dateJoined));

    return rows;
  });

  let visibleActivity = $derived.by(() => {
    let rows = [...org.activity];
    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query)
      );
    }

    if (viewMode === 'status_active') rows = rows.filter((row) => row.status === 'active');
    if (viewMode === 'status_inactive') rows = rows.filter((row) => row.status === 'inactive');
    if (viewMode === 'last30') rows = rows.filter((row) => isWithinLastDays(row.dateJoined, 30));
    if (viewMode === 'last90') rows = rows.filter((row) => isWithinLastDays(row.dateJoined, 90));

    if (viewMode === 'name_asc') rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (viewMode === 'name_desc') rows.sort((a, b) => b.name.localeCompare(a.name));
    else if (viewMode === 'oldest') rows.sort((a, b) => getRecencyValue(a.dateJoined) - getRecencyValue(b.dateJoined));
    else rows.sort((a, b) => getRecencyValue(b.dateJoined) - getRecencyValue(a.dateJoined));

    return rows;
  });

  function confirmBlock() {
    showBlockModal = false;
    // TODO: call API
  }

  function openEditModal() {
    editName = data.organization.name;
    editOwnerName = data.owner?.name ?? '';
    editOwnerEmail = data.owner?.email ?? data.organization.email ?? '';
    editOwnerTitle = data.owner?.role ?? 'Owner';
    editOwnerUserId = data.owner?.userId ?? '';
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
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

{#if form?.successMessage}
  <div class="px-4 sm:px-6 lg:px-8 pt-6">
    <div class="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
      {form.successMessage}
    </div>
  </div>
{/if}

{#if form?.errorMessage}
  <div class="px-4 sm:px-6 lg:px-8 pt-6">
    <div class="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
      {form.errorMessage}
    </div>
  </div>
{/if}

{#if showEditModal}
  <div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] p-4 flex items-center justify-center" role="dialog" aria-modal="true" tabindex="-1" onclick={closeEditModal} onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && closeEditModal()}>
    <div class="w-full max-w-160 rounded-2xl bg-white shadow-xl border border-[#e5e7eb]" role="presentation" onclick={(event) => event.stopPropagation()}>
      <div class="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
        <div>
          <h3 class="text-lg font-bold text-[#111827]">Edit Organization</h3>
          <p class="text-sm text-[#9ca3af]">Update the organization and owner details.</p>
        </div>
        <button aria-label="Close edit modal" onclick={closeEditModal} class="text-[#9ca3af] hover:text-[#374151] transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form method="POST" action="?/updateOrganization" class="px-5 py-5 space-y-4">
        <input type="hidden" name="ownerUserId" value={editOwnerUserId} />

        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5" for="organization-name">Organization name</label>
          <input id="organization-name" name="name" bind:value={editName} class="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5" for="owner-name">Owner name</label>
            <input id="owner-name" name="ownerName" bind:value={editOwnerName} class="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5" for="owner-title">Owner title</label>
            <input id="owner-title" name="ownerTitle" bind:value={editOwnerTitle} class="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5" for="owner-email">Owner email</label>
          <input id="owner-email" name="ownerEmail" type="email" bind:value={editOwnerEmail} class="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button type="button" onclick={closeEditModal} class="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors">Cancel</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-[#134e4a] text-white text-sm font-semibold hover:bg-[#0f3f3c] transition-colors">Save changes</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Block confirm modal backdrop -->
{#if showBlockModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4" role="dialog" aria-modal="true" tabindex="-1" onclick={() => showBlockModal = false} onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && (showBlockModal = false)}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-75 p-6 relative" role="presentation" onclick={(e) => e.stopPropagation()}>
      <button aria-label="Close block confirmation" onclick={() => showBlockModal = false}
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

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-350">

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
        <button type="button" aria-label="Edit organization" onclick={openEditModal} class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold
                       border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <span class="hidden sm:inline">Edit</span>
        </button>
        <button type="button" aria-label="Block organization" onclick={() => showBlockModal = true}
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
    {#each stats as stat (stat.key)}
      <div class="bg-white rounded-xl border border-[#e5e7eb] p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[#9ca3af] leading-tight">
            {stat.label}
          </span>
          <div class="w-7 h-7 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              {#if stat.icon === 'venues'}
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              {:else if stat.icon === 'reservations'}
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              {:else if stat.icon === 'revenue'}
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              {:else}
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              {/if}
            </svg>
          </div>
        </div>
        <div class="text-2xl sm:text-[1.75rem] font-bold text-[#111827] leading-none">
          {stat.value()}
        </div>
      </div>
    {/each}
  </div>

  <!-- ── Tabs ──────────────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">

    <!-- Tab nav -->
    <div class="flex border-b border-[#f0f0f0] overflow-x-auto">
      {#each tabs as tab (tab.key)}
        <button
          onclick={() => setTab(tab.key)}
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
               bind:value={search}
               class="pl-8 pr-4 py-1.5 text-xs rounded-lg border border-[#e5e7eb] w-48
                      focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                      placeholder:text-[#9ca3af]"/>
      </div>
      <div class="flex items-center gap-2 sm:ml-auto">
        <label class="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] bg-white">
          <svg class="w-3 h-3 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
          </svg>
          <select bind:value={viewMode} class="bg-transparent pr-1 text-xs focus:outline-none">
            {#each viewOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
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
            {#each visibleVenues as venue (venue.id)}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{venue.name}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] max-w-65">{venue.address}</td>
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
                  <button type="button" aria-label={`Venue actions for ${venue.name}`} class="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors">
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
        <p class="text-xs text-[#6b7280]">Showing 1-{visibleVenues.length} of {org.venueCount}</p>
        <div class="flex items-center gap-1">
          <button type="button" aria-label="Previous venues page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button type="button" aria-label="Current venues page 1" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button type="button" aria-label="Next venues page" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647]">
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
            {#each visibleReservations as res (res.id)}
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
        <p class="text-xs text-[#6b7280]">Showing 1-{visibleReservations.length} of {org.reservationCount}</p>
        <div class="flex items-center gap-1">
          <button type="button" aria-label="Previous reservations page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button type="button" aria-label="Current reservations page 1" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button type="button" aria-label="Next reservations page" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647]">
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
            {#each visibleTeam as member (member.id)}
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
        <p class="text-xs text-[#6b7280]">Showing 1-{visibleTeam.length} of {org.team.length}</p>
        <div class="flex items-center gap-1">
          <button type="button" aria-label="Previous team page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button type="button" aria-label="Current team page 1" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button type="button" aria-label="Next team page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
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
            {#each visibleActivity as item (item.id)}
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
        <p class="text-xs text-[#6b7280]">Showing 1-{visibleActivity.length} of {org.activity.length}</p>
        <div class="flex items-center gap-1">
          <button type="button" aria-label="Previous activity page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button type="button" aria-label="Current activity page 1" class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button type="button" aria-label="Next activity page" class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    {/if}

  </div>
</div>