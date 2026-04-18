<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import { formatCurrency, formatDate } from '$utils/helpers';
  import type { PageData } from './$types';

  type ActionResult = {
    successMessage?: string;
    errorMessage?: string;
    dryRunReport?: {
      reservations: number;
      guests: number;
      missing: number;
    };
  };

  let { data, form }: { data: PageData; form?: ActionResult } = $props();

  type ResStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
  type StatusVariant = 'success' | 'warning' | 'info' | 'error';

  const statusMap: Record<ResStatus, { label: string; variant: StatusVariant }> = {
    confirmed: { label: 'Confirmed', variant: 'success' },
    pending:   { label: 'Pending',   variant: 'warning' },
    completed: { label: 'Completed', variant: 'info' },
    cancelled: { label: 'Cancelled', variant: 'error' }
  };

  let search = $state('');
  let filterStatus = $state('all');
  let selectedReservationIds = $state<string[]>([]);

  let filtered = $derived(data.reservations.filter(r => {
    const matchSearch =
      r.guest.toLowerCase().includes(search.toLowerCase()) ||
      r.venue.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  }));

  let allFilteredSelected = $derived(
    filtered.length > 0 && filtered.every((reservation) => selectedReservationIds.includes(reservation.id))
  );

  let totalAmount = $derived(filtered.reduce((sum, r) => sum + (Number(r.amount) || 0), 0));

  function toggleReservationSelection(reservationId: string, checked: boolean) {
    if (checked) {
      if (!selectedReservationIds.includes(reservationId)) {
        selectedReservationIds = [...selectedReservationIds, reservationId];
      }
      return;
    }

    selectedReservationIds = selectedReservationIds.filter((id) => id !== reservationId);
  }

  function toggleSelectAllFiltered(checked: boolean) {
    if (!checked) {
      selectedReservationIds = selectedReservationIds.filter((id) => !filtered.some((reservation) => reservation.id === id));
      return;
    }

    selectedReservationIds = Array.from(new Set([...selectedReservationIds, ...filtered.map((reservation) => reservation.id)]));
  }

  function selectAllRecords() {
    selectedReservationIds = data.reservations.map((reservation) => reservation.id);
  }

  function clearSelection() {
    selectedReservationIds = [];
  }

  function confirmBulkDelete(event: SubmitEvent) {
    if (selectedReservationIds.length === 0) {
      event.preventDefault();
      return;
    }
    if (!confirm(`Delete ${selectedReservationIds.length} reservation(s) and related guest records? This cannot be undone.`)) {
      event.preventDefault();
    }
  }
</script>

<svelte:head>
  <title>Reservations — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reservations' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  {#if form?.successMessage}
    <div class="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
      {form.successMessage}
    </div>
  {/if}
  {#if form?.errorMessage}
    <div class="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
      {form.errorMessage}
    </div>
  {/if}
  {#if form?.dryRunReport}
    <div class="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
      Dry run: {form.dryRunReport.reservations} reservation(s) and {form.dryRunReport.guests} guest record(s) will be affected.{#if form.dryRunReport.missing} Missing reservations: {form.dryRunReport.missing}.{/if}
    </div>
  {/if}

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

  {#if data.canDelete}
    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-3">
      <label class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151]">
        <input type="checkbox" checked={allFilteredSelected} onchange={(event) => toggleSelectAllFiltered((event.target as HTMLInputElement).checked)} />
        Select filtered ({filtered.length})
      </label>
      <button type="button" onclick={selectAllRecords}
        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
        Select all reservations ({data.reservations.length})
      </button>
      <button type="button" onclick={clearSelection}
        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb] transition-colors">
        Clear
      </button>

      <form method="POST" action="?/deleteSelectedReservations" onsubmit={confirmBulkDelete}>
        {#each selectedReservationIds as reservationId (reservationId)}
          <input type="hidden" name="reservationIds" value={reservationId} />
        {/each}
        <button
          type="submit"
          formaction="?/previewSelectedReservations"
          class="mr-2 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={selectedReservationIds.length === 0}
        >
          Dry run ({selectedReservationIds.length})
        </button>
        <button
          type="submit"
          disabled={selectedReservationIds.length === 0}
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete selected ({selectedReservationIds.length})
        </button>
      </form>
    </div>
  {/if}

  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            {#if data.canDelete}
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Select</th>
            {/if}
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Guest</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Venue / Org</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Amount</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as res (res.id)}
            <tr class="hover:bg-[#fafafa] transition-colors">
              {#if data.canDelete}
                <td class="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedReservationIds.includes(res.id)}
                    onchange={(event) => toggleReservationSelection(res.id, (event.target as HTMLInputElement).checked)}
                  />
                </td>
              {/if}
              <td class="px-5 py-4">
                <div class="flex items-center gap-2.5">
                  <Avatar name={res.guest} size="xs" />
                  <div>
                    <p class="font-medium text-[#111827]">{res.guest}</p>
                    <p class="text-[11px] text-[#9ca3af]">{res.guestEmail}</p>
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
                <Badge variant={statusMap[res.status as ResStatus]?.variant ?? 'neutral'} dot>
                  {statusMap[res.status as ResStatus]?.label ?? res.status}
                </Badge>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan={data.canDelete ? 6 : 5} class="px-5 py-8 text-center text-sm text-[#9ca3af]">No reservations found.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each filtered as res (res.id)}
        <div class="flex items-center gap-3 px-4 py-4">
          {#if data.canDelete}
            <input
              type="checkbox"
              class="shrink-0"
              checked={selectedReservationIds.includes(res.id)}
              onchange={(event) => toggleReservationSelection(res.id, (event.target as HTMLInputElement).checked)}
            />
          {/if}
          <Avatar name={res.guest} size="sm" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-[#111827] truncate">{res.guest}</p>
            <p class="text-xs text-[#9ca3af]">{res.venue} · {formatDate(res.date)}</p>
          </div>
          <div class="flex flex-col items-end gap-1 shrink-0">
            <span class="text-sm font-semibold text-[#111827]">{formatCurrency(res.amount)}</span>
            <Badge variant={statusMap[res.status as ResStatus]?.variant ?? 'neutral'} size="sm">
              {statusMap[res.status as ResStatus]?.label ?? res.status}
            </Badge>
          </div>
        </div>
      {:else}
        <p class="px-4 py-8 text-center text-sm text-[#9ca3af]">No reservations found.</p>
      {/each}
    </div>
  </div>
</div>
