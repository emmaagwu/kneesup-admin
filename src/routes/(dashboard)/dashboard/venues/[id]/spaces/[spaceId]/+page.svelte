<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import TopBar from '$components/layout/TopBar.svelte';

  type SpaceStatus = 'active' | 'inactive';
  type SpaceTab = 'operating-hours' | 'rules' | 'gallery' | 'documents';

  interface Amenity { label: string; icon: string; }
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

  // ── Shared ────────────────────────────────────────────────────────
  const sharedAmenities: Amenity[] = [
    { label: 'Air Conditioning/Heating', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>` },
    { label: 'Wi-Fi Access', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>` },
    { label: 'Projector and Screen', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>` },
    { label: 'Audio/Visual Equipment', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>` },
    { label: 'Parking Availability', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M8 12h5m-5 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>` },
    { label: 'Outdoor space', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>` },
    { label: 'Reception Services', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    { label: 'Conference Room', icon: `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
  ];

  const sharedPricing = {
    items: [
      { label: 'Price Per Hour', value: '$200' },
      { label: 'Minimum Rental Time', value: '2 Hours' },
      { label: 'Cleaning Fee', value: '$30' },
    ],
    additionalFees: [{ name: 'Cleaning Fee', amount: '$30' }]
  };

  const sharedHours: Record<string, DayHours> = {
    Monday:    { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Tuesday:   { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }, { from: '10:00 AM', to: '6:00 PM' }] },
    Wednesday: { enabled: true,  slots: [{ from: '10:00 AM', to: '6:00 PM' }] },
    Thursday:  { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Friday:    { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Saturday:  { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Sunday:    { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  };

  const sharedRules = [
    'No loud music after 11 p.m.',
    'Pets are not allowed',
    'Guests must remove any equipment they bring into the space by the end of the booking',
  ];

  const sharedGallery = [
    '/images/venue-image1.png', '/images/venue-image2.png',
    '/images/venue-image3.png', '/images/venue-image4.png',
    '/images/venue-image5.png', '/images/venue-image6.png',
    '/images/venue-image7.png', '/images/venue-image8.png',
  ];

  // ── Space DB ──────────────────────────────────────────────────────
  const spaceDb: Record<string, SpaceDetail> = {
    's1': {
      id: 's1', venueId: '8', venueName: 'Rhythm Lounge',
      name: 'Conference Room', capacity: 100, status: 'active',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.',
      amenities: sharedAmenities,
      pricing: sharedPricing,
      hours: JSON.parse(JSON.stringify(sharedHours)),
      rules: [...sharedRules],
      gallery: sharedGallery,
    },
    's2': {
      id: 's2', venueId: '8', venueName: 'Rhythm Lounge',
      name: 'Exhibition Hall', capacity: 600, status: 'active',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.',
      amenities: sharedAmenities,
      pricing: sharedPricing,
      hours: JSON.parse(JSON.stringify(sharedHours)),
      rules: [...sharedRules],
      gallery: sharedGallery,
    },
    's3': {
      id: 's3', venueId: '8', venueName: 'Rhythm Lounge',
      name: 'Auditorium', capacity: 1500, status: 'inactive',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.',
      amenities: sharedAmenities,
      pricing: sharedPricing,
      hours: JSON.parse(JSON.stringify(sharedHours)),
      rules: [...sharedRules],
      gallery: sharedGallery,
    },
  };

  // ── State ─────────────────────────────────────────────────────────
  let venueId  = $derived($page.params.id);
  let spaceId  = $derived($page.params.spaceId);
  let space    = $derived(spaceDb[spaceId] ?? spaceDb['s1']);

  let activeTab   = $state<SpaceTab>('operating-hours');
  let showBlockModal  = $state(false);
  let hoursEdited     = $state(false);
  let editableHours   = $state<Record<string, DayHours>>(JSON.parse(JSON.stringify(sharedHours)));
  let editableRules   = $state<string[]>([...sharedRules]);
  let lightboxSrc     = $state<string | null>(null);

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const timeOptions = [
    '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
    '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
    '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
  ];

  function toggleDay(day: string) { editableHours[day].enabled = !editableHours[day].enabled; hoursEdited = true; }
  function addSlot(day: string) { editableHours[day].slots = [...editableHours[day].slots, { from: '6:00 AM', to: '8:00 AM' }]; hoursEdited = true; }
  function removeSlot(day: string, i: number) { editableHours[day].slots = editableHours[day].slots.filter((_, idx) => idx !== i); hoursEdited = true; }
  function saveHours() { hoursEdited = false; }
  function deleteRule(i: number) { editableRules = editableRules.filter((_, idx) => idx !== i); }
  function addRule() { editableRules = [...editableRules, '']; }

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
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
       onclick={() => lightboxSrc = null}>
    <img src={lightboxSrc} alt="Gallery" class="max-w-full max-h-[90vh] rounded-xl object-contain"/>
    <button onclick={() => lightboxSrc = null}
      class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
{/if}

<!-- Block modal -->
{#if showBlockModal}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
       onclick={() => showBlockModal = false}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-[300px] p-6 relative"
         onclick={(e) => e.stopPropagation()}>
      <button onclick={() => showBlockModal = false}
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

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px]">

  <!-- ── Header card ───────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] px-5 sm:px-6 py-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Back button -->
        <button onclick={() => goto(`/dashboard/venues/${venueId}`)}
          class="w-10 h-10 rounded-full border border-[#e5e7eb] flex items-center justify-center
                 text-[#6b7280] hover:bg-[#f9fafb] transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <!-- Avatar -->
        <div class="w-12 h-12 rounded-full overflow-hidden shrink-0
                    {getAvatarColor(space.name)} flex items-center justify-center text-white font-bold">
          {space.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-[#111827]">{space.name}</h1>
          <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full {statusBadge[space.status]}">
            {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
          </span>
        </div>
      </div>
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

    <!-- Space Details section -->
    <div class="mt-5 pt-5 border-t border-[#f3f4f6]">
      <p class="text-xs font-semibold text-[#374151] mb-3">Space Details</p>
      <div class="mb-4">
        <p class="text-xs text-[#9ca3af] mb-0.5">Description</p>
        <p class="text-sm text-[#374151] leading-relaxed">{space.description}</p>
      </div>
      <div>
        <p class="text-xs text-[#9ca3af] mb-0.5">Capacity</p>
        <p class="text-sm font-semibold text-[#111827]">{space.capacity} Guests</p>
      </div>
    </div>
  </div>

  <!-- ── Amenities + Pricing ────────────────────────────────────── -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <!-- Amenities -->
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-5">
      <div class="flex items-center justify-between mb-4">
        <p class="text-[10px] font-bold tracking-widest uppercase text-[#9ca3af]">Amenities</p>
        <button class="text-[#6b7280] hover:text-[#374151] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each space.amenities as amenity}
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#e5e7eb]
                       bg-[#87B8B3]/20 text-xs font-medium text-[#477A79]">
            <span class="text-[#6b7280]">{@html amenity.icon}</span>
            {amenity.label}
          </span>
        {/each}
      </div>
    </div>

    <!-- Pricing -->
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-5">
      <div class="flex items-center justify-between mb-4">
        <p class="text-[10px] font-bold tracking-widest uppercase text-[#9ca3af]">Pricing</p>
        <button class="text-[#6b7280] hover:text-[#374151] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-x-6 gap-y-4">
        {#each space.pricing.items as item}
          <div>
            <p class="text-xs text-[#9ca3af] mb-0.5">{item.label}</p>
            <p class="text-sm font-semibold text-[#111827]">{item.value}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- ── Tabs ──────────────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">

    <!-- Tab nav -->
    <div class="flex border-b border-[#f0f0f0] overflow-x-auto">
      {#each tabs as tab}
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
              class="px-4 py-2 rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold hover:bg-[#243647] transition-colors">
              Save Changes
            </button>
          {/if}
        </div>

        <div class="space-y-5">
          {#each days as day}
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-[#374151] w-24 shrink-0">{day}</span>
                <button type="button" onclick={() => toggleDay(day)}
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                         {editableHours[day].enabled ? 'bg-[#134e4a]' : 'bg-[#d1d5db]'}">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                               {editableHours[day].enabled ? 'translate-x-6' : 'translate-x-1'}"/>
                </button>
                {#if !editableHours[day].enabled}
                  <span class="text-sm text-[#9ca3af] ml-auto">Closed</span>
                {/if}
              </div>

              {#if editableHours[day].enabled}
                <div class="pl-28 space-y-2">
                  {#each editableHours[day].slots as slot, i}
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="relative">
                        <select bind:value={slot.from} onchange={() => hoursEdited = true}
                          class="pl-3 pr-7 py-2 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <span class="text-xs text-[#6b7280]">to</span>
                      <div class="relative">
                        <select bind:value={slot.to} onchange={() => hoursEdited = true}
                          class="pl-3 pr-7 py-2 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      {#if editableHours[day].slots.length > 1}
                        <button onclick={() => removeSlot(day, i)}
                          class="text-[#9ca3af] hover:text-[#dc2626] transition-colors p-0.5">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      {/if}
                      {#if i === editableHours[day].slots.length - 1}
                        <button onclick={() => addSlot(day)}
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
          <button onclick={addRule}
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a2e3b] text-white
                   text-xs font-semibold hover:bg-[#243647] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add Rule
          </button>
        </div>

        <div class="divide-y divide-[#f9fafb]">
          {#each editableRules as rule, i}
            <div class="flex items-center justify-between py-4 gap-4">
              <p class="text-sm text-[#374151] flex-1">{rule}</p>
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
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {#each space.gallery as img, i}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div
              class="rounded-xl overflow-hidden aspect-[4/3] bg-[#f3f4f6] cursor-pointer
                     hover:opacity-90 transition-opacity"
              onclick={() => lightboxSrc = img}
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
      </div>

    <!-- ── DOCUMENTS ──────────────────────────────────────────── -->
    {:else if activeTab === 'documents'}
      <div class="px-4 sm:px-6 py-6">
        <h3 class="text-sm font-semibold text-[#111827] mb-5">Documents</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each Array(2) as _}
            <div class="rounded-xl bg-[#f3f4f6] aspect-[4/3] animate-pulse"></div>
          {/each}
        </div>
        <div class="mt-8 flex flex-col items-center justify-center py-8 text-center">
          <div class="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-[#374151]">No documents yet</p>
          <p class="text-xs text-[#9ca3af] mt-1">Uploaded documents will appear here</p>
          <button class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                         border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Upload Document
          </button>
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