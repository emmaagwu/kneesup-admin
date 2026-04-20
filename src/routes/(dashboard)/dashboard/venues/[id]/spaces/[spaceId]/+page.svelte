<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import TopBar from '$components/layout/TopBar.svelte';
  import type { PageData } from './$types';

  type SpaceStatus = 'active' | 'inactive';
  type SpaceTab = 'operating-hours' | 'rules' | 'gallery' | 'documents';

  type ActionResult = {
    successMessage?: string;
    errorMessage?: string;
  };

  let { data, form }: { data: PageData; form?: ActionResult } = $props();

  interface Amenity { label: string; }
  interface PricingItem { label: string; value: string; }
  interface DayHours { enabled: boolean; slots: { from: string; to: string }[] }
  interface SpaceDetail {
    id: string; venueId: string; venueName: string;
    name: string; description: string; capacity: number;
    status: SpaceStatus;
    amenities: Amenity[];
    pricing: { items: PricingItem[]; additionalFees: { name: string; amount: string }[] };
    hours: Record<string, DayHours>;
    rules: string[];
    gallery: string[];
  }

  type LoadedVenue = NonNullable<PageData['venue']>;
  type LoadedSpace = NonNullable<PageData['space']>;

  const dayKeys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

  function createEmptyHours() {
    return Object.fromEntries(
      dayKeys.map((day) => [day, { enabled: false, slots: [] }])
    ) as Record<string, DayHours>;
  }

  function cloneHours(value: Record<string, DayHours>) {
    return JSON.parse(JSON.stringify(value)) as Record<string, DayHours>;
  }

  function buildPricing(space: LoadedSpace): { items: PricingItem[]; additionalFees: { name: string; amount: string }[] } {
    const model = space.pricingModel ?? 'contact';
    const items: PricingItem[] = [{
      label: 'Pricing Type',
      value:
        model === 'hour'
          ? 'Per Hour'
          : model === 'guest'
            ? 'Per Guest'
            : model === 'flat'
              ? 'Flat Rental Fee'
              : 'Contact for Pricing'
    }];

    if (model === 'hour') {
      items.push({ label: 'Hourly Rate', value: space.hourlyRate ? `$${space.hourlyRate}` : '—' });
      items.push({ label: 'Minimum Hours', value: space.minBookingHours || '—' });
      items.push({ label: 'Maximum Hours', value: typeof space.maxBookingHours === 'string' ? (space.maxBookingHours || '—') : '—' });
    }

    if (model === 'guest') {
      items.push({ label: 'Per Guest Rate', value: typeof space.perGuestRate === 'string' && space.perGuestRate ? `$${space.perGuestRate}` : '—' });
      items.push({ label: 'Minimum Guests', value: typeof space.minGuestCount === 'string' ? (space.minGuestCount || '—') : '—' });
      items.push({ label: 'Maximum Guests', value: typeof space.maxGuestCount === 'string' ? (space.maxGuestCount || '—') : '—' });
    }

    if (model === 'flat') {
      items.push({ label: 'Flat Rate', value: typeof space.flatRate === 'string' && space.flatRate ? `$${space.flatRate}` : '—' });
    }

    if (model !== 'contact') {
      items.push({ label: 'What\'s Included', value: space.whatsIncluded || '—' });
    }

    return {
      items,
      additionalFees: (space.additionalFees ?? []).map((fee) => ({
        name: fee.name,
        amount: fee.amount
      }))
    };
  }

  function buildAmenities(space: LoadedSpace): Amenity[] {
    if (!space.amenities || space.amenities.length === 0) return [];
    return space.amenities
      .filter((amenity) => amenity.label)
      .map((amenity) => ({
        label: amenity.label
      }));
  }

  function buildSpaceDetail(venue: LoadedVenue, space: LoadedSpace): SpaceDetail {
    const hours = space.operatingHours ? cloneHours(space.operatingHours) : createEmptyHours();

    return {
      id: space.id,
      venueId: venue.id,
      venueName: venue.name,
      name: space.name,
      capacity: space.maxGuest,
      status: space.status,
      description: space.description,
      amenities: buildAmenities(space),
      pricing: buildPricing(space),
      hours,
      rules: space.rules ? [...space.rules] : [],
      gallery: space.gallery && space.gallery.length > 0 ? [...space.gallery] : (venue.gallery?.length ? [...venue.gallery] : [''])
    };
  }

  let venue = $derived(data.venue);
  let space = $derived.by(() => buildSpaceDetail(data.venue, data.space));
  let venueId = $derived(venue.id);

  let activeTab   = $state<SpaceTab>('operating-hours');
  let showBlockModal  = $state(false);
  let saveMessage = $state('');
  let saveError = $state('');
  let editingSpaceDetails = $state(false);
  let savingSpaceDetails = $state(false);
  let savingRules = $state(false);
  let savingAmenities = $state(false);
  let savingPricing = $state(false);
  let editingPricing = $state(false);
  let savingHours = $state(false);
  let hoursEdited     = $state(false);
  let editableHours   = $state<Record<string, DayHours>>(createEmptyHours());
  let editableRules   = $state<string[]>([]);
  let editableAmenities = $state<string[]>([]);
  let amenityInput = $state('');
  let pricingModel = $state<'hour' | 'guest' | 'flat' | 'contact'>('contact');
  let hourlyRate = $state('');
  let minBookingHours = $state('');
  let maxBookingHours = $state('');
  let perGuestRate = $state('');
  let minGuestCount = $state('');
  let maxGuestCount = $state('');
  let flatRate = $state('');
  let whatsIncluded = $state('');
  let lightboxSrc     = $state<string | null>(null);
  let editSpaceName = $state('');
  let editSpaceDescription = $state('');
  let editSpaceCapacity = $state('');
  let editSpaceStatus = $state<SpaceStatus>('active');

  $effect(() => {
    editableHours = cloneHours(space.hours);
    editableRules = [...space.rules];
    editableAmenities = space.amenities.map((amenity) => amenity.label);
    pricingModel = (data.space.pricingModel ?? 'contact') as 'hour' | 'guest' | 'flat' | 'contact';
    hourlyRate = data.space.hourlyRate ?? '';
    minBookingHours = data.space.minBookingHours ?? '';
    maxBookingHours = data.space.maxBookingHours ?? '';
    perGuestRate = data.space.perGuestRate ?? '';
    minGuestCount = data.space.minGuestCount ?? '';
    maxGuestCount = data.space.maxGuestCount ?? '';
    flatRate = data.space.flatRate ?? '';
    whatsIncluded = data.space.whatsIncluded ?? '';
    editSpaceName = space.name;
    editSpaceDescription = space.description;
    editSpaceCapacity = String(space.capacity || '');
    editSpaceStatus = space.status;
  });

  const days = dayKeys;
  const timeOptions = [
    '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
    '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
    '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
  ];

  function toggleDay(day: string) {
    editableHours[day].enabled = !editableHours[day].enabled;
    if (editableHours[day].enabled && editableHours[day].slots.length === 0) {
      editableHours[day].slots = [{ from: '6:00 AM', to: '8:00 AM' }];
    }
    hoursEdited = true;
  }
  function addSlot(day: string) { editableHours[day].slots = [...editableHours[day].slots, { from: '6:00 AM', to: '8:00 AM' }]; hoursEdited = true; }
  function removeSlot(day: string, i: number) { editableHours[day].slots = editableHours[day].slots.filter((_, idx) => idx !== i); hoursEdited = true; }
  async function saveHours() {
    hoursEdited = false;
    savingHours = true;
    saveError = '';
    saveMessage = '';
    const payload = new FormData();
    payload.append('operatingHours', JSON.stringify(editableHours));
    const response = await fetch('?/updateOperatingHours', { method: 'POST', body: payload });
    savingHours = false;
    if (!response.ok) {
      saveError = 'Failed to update operating hours.';
      return;
    }
    saveMessage = 'Operating hours updated.';
    await invalidateAll();
  }
  function deleteRule(i: number) { editableRules = editableRules.filter((_, idx) => idx !== i); }
  function addRule() { editableRules = [...editableRules, '']; }
  function removeAmenity(index: number) {
    editableAmenities = editableAmenities.filter((_, i) => i !== index);
  }
  function addAmenity() {
    const value = amenityInput.trim();
    if (!value) return;
    if (!editableAmenities.includes(value)) {
      editableAmenities = [...editableAmenities, value];
    }
    amenityInput = '';
  }

  async function saveRules() {
    savingRules = true;
    saveError = '';
    saveMessage = '';
    const payload = new FormData();
    payload.append('rules', editableRules.map((rule) => rule.trim()).filter(Boolean).join('\n'));
    const response = await fetch('?/updateRules', { method: 'POST', body: payload });
    savingRules = false;
    if (!response.ok) {
      saveError = 'Failed to update rules.';
      return;
    }
    saveMessage = 'Rules updated.';
    await invalidateAll();
  }

  async function saveAmenities() {
    savingAmenities = true;
    saveError = '';
    saveMessage = '';
    const payload = new FormData();
    payload.append('amenities', editableAmenities.map((amenity) => amenity.trim()).filter(Boolean).join('\n'));
    const response = await fetch('?/updateAmenities', { method: 'POST', body: payload });
    savingAmenities = false;
    if (!response.ok) {
      saveError = 'Failed to update amenities.';
      return;
    }
    saveMessage = 'Amenities updated.';
    await invalidateAll();
  }

  async function savePricing() {
    savingPricing = true;
    saveError = '';
    saveMessage = '';
    const payload = new FormData();
    payload.append('pricingModel', pricingModel);
    payload.append('hourlyRate', hourlyRate);
    payload.append('minBookingHours', minBookingHours);
    payload.append('maxBookingHours', maxBookingHours);
    payload.append('perGuestRate', perGuestRate);
    payload.append('minGuestCount', minGuestCount);
    payload.append('maxGuestCount', maxGuestCount);
    payload.append('flatRate', flatRate);
    payload.append('whatsIncluded', whatsIncluded);
    const response = await fetch('?/updatePricing', { method: 'POST', body: payload });
    savingPricing = false;
    if (!response.ok) {
      saveError = 'Failed to update pricing.';
      return;
    }
    saveMessage = 'Pricing updated.';
    editingPricing = false;
    await invalidateAll();
  }

  function startEditPricing() {
    editingPricing = true;
    pricingModel = (data.space.pricingModel ?? 'contact') as 'hour' | 'guest' | 'flat' | 'contact';
    hourlyRate = data.space.hourlyRate ?? '';
    minBookingHours = data.space.minBookingHours ?? '';
    maxBookingHours = data.space.maxBookingHours ?? '';
    perGuestRate = data.space.perGuestRate ?? '';
    minGuestCount = data.space.minGuestCount ?? '';
    maxGuestCount = data.space.maxGuestCount ?? '';
    flatRate = data.space.flatRate ?? '';
    whatsIncluded = data.space.whatsIncluded ?? '';
  }

  async function saveSpaceDetails() {
    savingSpaceDetails = true;
    saveError = '';
    saveMessage = '';
    const payload = new FormData();
    payload.append('name', editSpaceName);
    payload.append('description', editSpaceDescription);
    payload.append('capacity', editSpaceCapacity);
    payload.append('status', editSpaceStatus);
    const response = await fetch('?/updateSpaceDetails', { method: 'POST', body: payload });
    savingSpaceDetails = false;
    if (!response.ok) {
      saveError = 'Failed to update space details.';
      return;
    }
    saveMessage = 'Space details updated.';
    editingSpaceDetails = false;
    await invalidateAll();
  }

  const statusBadge: Record<string, string> = {
    active:   'text-[#16a34a] bg-[#f0fdf4]',
    inactive: 'text-[#d97706] bg-[#fffbeb]',
  };

  const tabs: { key: SpaceTab; label: string }[] = [
    { key: 'operating-hours', label: 'Operating Hours' },
    { key: 'rules',           label: 'Rules' },
    { key: 'gallery',         label: 'Gallery' },
    { key: 'documents',       label: 'Documents' },
  ];

  function getInitials(name: string) {
    return name.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase();
  }

  function getAvatarColor(name: string) {
    const c = ['bg-[#3b82f6]','bg-[#8b5cf6]','bg-[#ec4899]','bg-[#f59e0b]','bg-[#10b981]','bg-[#134e4a]'];
    return c[name.charCodeAt(0) % c.length];
  }
</script>

<svelte:head>
  <title>{space.name} — KneesUp Admin</title>
</svelte:head>

<!-- Lightbox -->
{#if lightboxSrc}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
       role="dialog" aria-modal="true" tabindex="0"
      onclick={() => lightboxSrc = null}
      onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && (lightboxSrc = null)}>
    <img src={lightboxSrc} alt="Gallery" class="max-w-full max-h-[90vh] rounded-xl object-contain"/>
    <button aria-label="Close gallery" onclick={() => lightboxSrc = null}
      class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
{/if}

<!-- Block modal -->
{#if showBlockModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
     role="dialog" aria-modal="true" tabindex="0"
      onclick={() => showBlockModal = false}
      onkeydown={(event) => (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && (showBlockModal = false)}>
   <div class="bg-white rounded-2xl shadow-xl w-full max-w-75 p-6 relative"
      role="presentation"
         onclick={(e) => e.stopPropagation()}>
    <button aria-label="Close block confirmation" onclick={() => showBlockModal = false}
        class="absolute top-4 right-4 text-[#9ca3af] hover:text-[#374151] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-full bg-[#fef2f2] flex items-center justify-center">
          <div class="w-9 h-9 rounded-full border-2 border-[#dc2626] flex items-center justify-center">
            <span class="text-[#dc2626] text-lg font-bold leading-none">!</span>
          </div>
        </div>
      </div>
      <h3 class="text-center text-base font-bold text-[#111827] mb-2">Are you sure?</h3>
      <p class="text-center text-xs text-[#6b7280] leading-relaxed mb-6">
        By blocking this space, guests will not be able to make reservations for it.
      </p>
      <div class="flex gap-3">
        <button onclick={() => showBlockModal = false}
          class="flex-1 py-2.5 rounded-lg border border-[#e5e7eb] text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors">
          Cancel
        </button>
        <button onclick={() => showBlockModal = false}
          class="flex-1 py-2.5 rounded-lg bg-[#dc2626] text-white text-sm font-semibold hover:bg-[#b91c1c] transition-colors">
          Block
        </button>
      </div>
    </div>
  </div>
{/if}

<TopBar
  breadcrumbs={[
    { label: 'Venues', href: '/dashboard/venues' },
    { label: 'Venue Details', href: `/dashboard/venues/${venueId}` },
    { label: space.venueName, href: `/dashboard/venues/${venueId}` },
    { label: space.name }
  ]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-350">

  {#if saveMessage || form?.successMessage}
    <div class="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
      {saveMessage || form?.successMessage}
    </div>
  {/if}
  {#if saveError || form?.errorMessage}
    <div class="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
      {saveError || form?.errorMessage}
    </div>
  {/if}

  <!-- ── Venue Header card ───────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] px-5 sm:px-6 py-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Back button -->
        <a href={resolve(`/dashboard/venues/${venueId}`)} aria-label="Go back to venue details"
          class="w-10 h-10 rounded-full border border-[#e5e7eb] flex items-center justify-center
                 text-[#6b7280] hover:bg-[#f9fafb] transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <!-- Avatar -->
        <div class="w-12 h-12 rounded-full overflow-hidden shrink-0
                    {getAvatarColor(space.name)} flex items-center justify-center text-white font-bold">
          {getInitials(space.name)}
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-[#111827]">{space.name}</h1>
          <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full {statusBadge[space.status]}">
            {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button aria-label="Edit space" onclick={() => editingSpaceDetails = true} class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold
                       border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <span class="hidden sm:inline">Edit</span>
        </button>
        <button aria-label="Block space" onclick={() => showBlockModal = true}
          class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold
                 border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          <span class="hidden sm:inline">Block</span>
        </button>
      </div>
    </div>

    <!-- Space Details section -->
    <div class="mt-5 pt-5 border-t border-[#f3f4f6]">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-semibold text-[#374151]">Space Details</p>
        {#if editingSpaceDetails}
          <div class="flex items-center gap-2">
            <button type="button" onclick={() => editingSpaceDetails = false}
              class="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#6b7280] hover:bg-[#f9fafb]">
              Cancel
            </button>
            <button type="button" onclick={saveSpaceDetails}
              class="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
              disabled={savingSpaceDetails}>
              {savingSpaceDetails ? 'Saving…' : 'Save'}
            </button>
          </div>
        {/if}
      </div>

      {#if editingSpaceDetails}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <label class="text-xs text-[#9ca3af] block mb-1" for="space-name">Name</label>
            <input id="space-name" bind:value={editSpaceName} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs text-[#9ca3af] block mb-1" for="space-description">Description</label>
            <textarea id="space-description" bind:value={editSpaceDescription} rows="3" class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]"></textarea>
          </div>
          <div>
            <label class="text-xs text-[#9ca3af] block mb-1" for="space-capacity">Capacity</label>
            <input id="space-capacity" bind:value={editSpaceCapacity} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
          </div>
          <div>
            <label class="text-xs text-[#9ca3af] block mb-1" for="space-status">Status</label>
            <select id="space-status" bind:value={editSpaceStatus}
              class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      {:else}
        <div class="mb-4">
          <p class="text-xs text-[#9ca3af] mb-0.5">Description</p>
          <p class="text-sm text-[#374151] leading-relaxed">{space.description}</p>
        </div>
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Capacity</p>
          <p class="text-sm font-semibold text-[#111827]">{space.capacity} Guests</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- ── Amenities + Pricing ────────────────────────────────────── -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <!-- Amenities -->
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-5">
        <div class="flex items-center justify-between mb-4">
        <p class="text-[10px] font-bold tracking-widest uppercase text-[#9ca3af]">Amenities</p>
        <button type="button" onclick={saveAmenities}
          class="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
          disabled={savingAmenities}>
          {savingAmenities ? 'Saving…' : 'Save'}
        </button>
      </div>
      {#if editableAmenities.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each editableAmenities as amenity, i (amenity + '-' + i)}
            <span class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#e5e7eb]
                         bg-[#87B8B3]/20 text-xs font-medium text-[#477A79]">
              {amenity}
              <button type="button" onclick={() => removeAmenity(i)} class="text-[#6b7280] hover:text-[#dc2626]">×</button>
            </span>
          {/each}
        </div>
      {:else}
        <div class="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-6 text-sm text-[#6b7280]">
          No amenities configured yet.
        </div>
      {/if}
      <div class="mt-4 flex gap-2">
        <input
          type="text"
          bind:value={amenityInput}
          placeholder="Add amenity"
          class="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        />
        <button type="button" onclick={addAmenity}
          class="px-3 py-2 rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold hover:bg-[#243647]">
          Add
        </button>
      </div>
    </div>

    <!-- Venue Space Pricing Card -->
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-5">
      <div class="flex items-center justify-between mb-4">
        <p class="text-[10px] font-bold tracking-widest uppercase text-[#9ca3af]">Pricing</p>
        <button type="button" onclick={() => editingPricing ? editingPricing = false : startEditPricing()}
          class="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]">
          {editingPricing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      <div class="space-y-3">
        {#if !editingPricing}
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            {#each space.pricing.items as item, index (item.label + '-' + index)}
              <div>
                <p class="text-xs text-[#9ca3af] mb-0.5">{item.label}</p>
                <p class="text-sm font-semibold text-[#111827]">{item.value}</p>
              </div>
            {/each}
          </div>

          {#if space.pricing.additionalFees.length > 0}
            <div class="pt-2 border-t border-[#f3f4f6]">
              <p class="text-xs text-[#9ca3af] mb-1">Additional Fees</p>
              <div class="space-y-1">
                {#each space.pricing.additionalFees as fee, i (fee.name + '-' + i)}
                  <p class="text-sm text-[#374151]">{fee.name}: {fee.amount}</p>
                {/each}
              </div>
            </div>
          {/if}
        {:else}
          <div class="pt-2 border-t border-[#f3f4f6] space-y-3">
            <div>
              <label class="text-xs text-[#9ca3af] block mb-1" for="pricing-model">Pricing Type</label>
              <select id="pricing-model" bind:value={pricingModel}
                class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                <option value="hour">Payment per Hour</option>
                <option value="guest">Payment per Guest</option>
                <option value="flat">Flat Rental Fee</option>
                <option value="contact">Contact for Pricing</option>
              </select>
            </div>

            {#if pricingModel === 'hour'}
              <div>
                <label class="text-xs text-[#9ca3af] block mb-1" for="hourly-rate">Hourly Rate</label>
                <input id="hourly-rate" bind:value={hourlyRate} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-[#9ca3af] block mb-1" for="min-booking-hours">Minimum Hours</label>
                  <input id="min-booking-hours" bind:value={minBookingHours} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
                </div>
                <div>
                  <label class="text-xs text-[#9ca3af] block mb-1" for="max-booking-hours">Maximum Hours</label>
                  <input id="max-booking-hours" bind:value={maxBookingHours} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
                </div>
              </div>
            {:else if pricingModel === 'guest'}
              <div>
                <label class="text-xs text-[#9ca3af] block mb-1" for="per-guest-rate">Per Guest Rate</label>
                <input id="per-guest-rate" bind:value={perGuestRate} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-[#9ca3af] block mb-1" for="min-guest-count">Minimum Guests</label>
                  <input id="min-guest-count" bind:value={minGuestCount} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
                </div>
                <div>
                  <label class="text-xs text-[#9ca3af] block mb-1" for="max-guest-count">Maximum Guests</label>
                  <input id="max-guest-count" bind:value={maxGuestCount} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
                </div>
              </div>
            {:else if pricingModel === 'flat'}
              <div>
                <label class="text-xs text-[#9ca3af] block mb-1" for="flat-rate">Flat Rental Fee</label>
                <input id="flat-rate" bind:value={flatRate} class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]" />
              </div>
            {/if}

            {#if pricingModel !== 'contact'}
              <div>
                <label class="text-xs text-[#9ca3af] block mb-1" for="whats-included">What's Included</label>
                <textarea id="whats-included" bind:value={whatsIncluded} rows="3" class="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]"></textarea>
              </div>
            {/if}

            <div class="flex justify-end pt-1">
              <button type="button" onclick={savePricing}
                class="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
                disabled={savingPricing}>
                {savingPricing ? 'Saving…' : 'Save Pricing'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- ── Tabs ──────────────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">

    <!-- Tab nav -->
    <div class="flex border-b border-[#f0f0f0] overflow-x-auto">
      {#each tabs as tab (tab.key)}
        <button
          onclick={() => activeTab = tab.key}
          class="px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0
                 {activeTab === tab.key
                   ? 'border-[#134e4a] text-[#134e4a]'
                   : 'border-transparent text-[#6b7280] hover:text-[#374151]'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- ── OPERATING HOURS ────────────────────────────────────── -->
    {#if activeTab === 'operating-hours'}
      <div class="px-4 sm:px-6 py-5">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold text-[#111827]">Operating Hours</h3>
          {#if hoursEdited}
            <button onclick={saveHours}
              class="px-4 py-2 rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold hover:bg-[#243647] transition-colors"
              disabled={savingHours}>
              {savingHours ? 'Saving…' : 'Save Changes'}
            </button>
          {/if}
        </div>

        <div class="space-y-5">
          {#each days as day (day)}
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-[#374151] w-24 shrink-0">{day}</span>
                  <button type="button" aria-label={`Toggle ${day} operating hours`} onclick={() => toggleDay(day)}
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                         {editableHours[day].enabled ? 'bg-[#134e4a]' : 'bg-[#d1d5db]'}">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                               {editableHours[day].enabled ? 'translate-x-6' : 'translate-x-1'}"></span>
                </button>
                {#if !editableHours[day].enabled}
                  <span class="text-sm text-[#9ca3af] ml-auto">Closed</span>
                {/if}
              </div>

              {#if editableHours[day].enabled}
                <div class="pl-28 space-y-2">
                  {#each editableHours[day].slots as slot, i (day + '-' + i)}
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="relative">
                        <select bind:value={slot.from} onchange={() => hoursEdited = true}
                          class="pl-3 pr-7 py-2 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t (t)}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <span class="text-xs text-[#6b7280]">to</span>
                      <div class="relative">
                        <select bind:value={slot.to} onchange={() => hoursEdited = true}
                          class="pl-3 pr-7 py-2 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t (t)}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      {#if editableHours[day].slots.length > 1}
                        <button aria-label={`Remove time slot for ${day}`} onclick={() => removeSlot(day, i)}
                          class="text-[#9ca3af] hover:text-[#dc2626] transition-colors p-0.5">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      {/if}
                      {#if i === editableHours[day].slots.length - 1}
                        <button aria-label={`Add time slot for ${day}`} onclick={() => addSlot(day)}
                          class="w-7 h-7 rounded-md border border-[#e5e7eb] flex items-center justify-center
                                 text-[#6b7280] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </button>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    <!-- ── RULES ──────────────────────────────────────────────── -->
    {:else if activeTab === 'rules'}
      <div class="px-4 sm:px-6 py-5">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-semibold text-[#111827]">Rules</h3>
          <div class="flex items-center gap-2">
            <button onclick={addRule}
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a2e3b] text-white
                     text-xs font-semibold hover:bg-[#243647] transition-colors">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Add Rule
            </button>
            <button onclick={saveRules}
              class="px-3 py-2 rounded-lg border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
              disabled={savingRules}>
              {savingRules ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div class="divide-y divide-[#f9fafb]">
          {#each editableRules as rule, i (i)}
            <div class="flex items-center justify-between py-4 gap-4">
              <input
                type="text"
                bind:value={editableRules[i]}
                placeholder="Enter rule"
                title={rule}
                class="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
              <button onclick={() => deleteRule(i)}
                class="text-sm font-semibold text-[#dc2626] hover:text-[#b91c1c] transition-colors shrink-0">
                Delete
              </button>
            </div>
          {/each}

          {#if editableRules.length === 0}
            <div class="py-12 text-center">
              <p class="text-sm font-medium text-[#374151]">No rules added yet</p>
              <p class="text-xs text-[#9ca3af] mt-1">Add rules to guide your guests</p>
            </div>
          {/if}
        </div>
      </div>

    <!-- ── GALLERY ────────────────────────────────────────────── -->
    {:else if activeTab === 'gallery'}
      <div class="px-4 sm:px-6 py-6">
        <h3 class="text-sm font-semibold text-[#111827] mb-5">Gallery</h3>
        {#if space.gallery.length > 0}
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {#each space.gallery as img, i (img + '-' + i)}
              <div
                class="rounded-xl overflow-hidden aspect-4/3 bg-[#f3f4f6] cursor-pointer
                       hover:opacity-90 transition-opacity"
                role="button"
                tabindex="0"
                onclick={() => lightboxSrc = img}
                onkeydown={(event) => (event.key === 'Enter' || event.key === ' ') && (lightboxSrc = img)}
              >
                <img
                  src={img}
                  alt="Space photo {i + 1}"
                  class="w-full h-full object-cover"
                  onerror={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.classList.add('flex','items-center','justify-center');
                    el.parentElement!.innerHTML = `<svg class="w-8 h-8 text-[#d1d5db]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                  }}
                />
              </div>
            {/each}
          </div>
        {:else}
          <div class="rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-6 py-14 text-center">
            <p class="text-sm font-semibold text-[#111827]">No gallery images yet</p>
            <p class="mt-1 text-xs text-[#6b7280]">Upload space photos when they become available.</p>
          </div>
        {/if}
      </div>

    <!-- ── DOCUMENTS ──────────────────────────────────────────── -->
    {:else if activeTab === 'documents'}
      <div class="px-4 sm:px-6 py-6">
        <h3 class="text-sm font-semibold text-[#111827] mb-5">Documents</h3>
        <div class="mt-8 flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa]">
          <div class="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-[#374151]">No documents yet</p>
          <p class="text-xs text-[#9ca3af] mt-1">Uploaded documents will appear here.</p>
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  .toast-slide-in {
    animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>