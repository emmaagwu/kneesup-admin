<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import TopBar from '$components/layout/TopBar.svelte';

  type VenueStatus = 'active' | 'inactive' | 'blocked';
  type SpaceStatus = 'active' | 'inactive';
  type Tab = 'spaces' | 'reservations' | 'operating-hours' | 'documents' | 'gallery';

  interface Space {
    id: string; name: string; description: string; maxGuest: number; status: SpaceStatus;
  }
  interface VenueReservation {
    id: string; client: string; email: string; venue: string; space: string;
    cost: string; dateTime: string; duration: string; status: 'active' | 'inactive';
  }
  type DayHours = { enabled: boolean; slots: { from: string; to: string }[] };
  interface VenueDetail {
    id: string; name: string; organization: string; address: string;
    description: string; status: VenueStatus;
    spaceCount: number; reservationCount: number; revenue: string;
    spaces: Space[]; reservations: VenueReservation[];
    hours: Record<string, DayHours>;
    gallery: string[];
  }

  // ── Shared data ───────────────────────────────────────────────────
  const sharedSpaces: Space[] = [
    { id: 's1', name: 'Conference Room', description: 'Cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus,', maxGuest: 25, status: 'active' },
    { id: 's2', name: 'Exhibition Hall',  description: 'non dictum mauris. Nulla at tellus sagittis, viverra est a, bibendum metus....', maxGuest: 600, status: 'active' },
    { id: 's3', name: 'Auditorium',       description: 'in pretium orci vestibulum eget. Class aptent taciti sociosqu ad litora torquent', maxGuest: 1500, status: 'inactive' },
  ];

  const sharedReservations: VenueReservation[] = [
    { id: 'r1', client: 'Darrell Steward',    email: 'felicia.reid@example.com', venue: 'The Ear Worm',    space: 'American Corner',  cost: '$27.91',  dateTime: '15 May 2020 8:00 pm',  duration: '2 hrs', status: 'active' },
    { id: 'r2', client: 'Robert Fox',         email: 'weaver@example.com',       venue: 'The BeatRoot',    space: 'Cisco Conclave',   cost: '$45.67',  dateTime: '15 May 2020 8:00 pm',  duration: '3 hrs', status: 'active' },
    { id: 'r3', client: 'Floyd Miles',        email: 'rivera@example.com',       venue: "Quaver's",        space: 'Conference Hall',  cost: '$116.34', dateTime: '15 May 2020 9:00 pm',  duration: '4 hrs', status: 'inactive' },
    { id: 'r4', client: 'Eleanor Pena',       email: 'jennings@example.com',     venue: "Euterpe's Hall",  space: 'Digital Domain',   cost: '$22.67',  dateTime: '15 May 2020 10:00 pm', duration: '5 hrs', status: 'active' },
    { id: 'r5', client: 'Cameron Williamson', email: 'baker@example.com',        venue: 'The Song Gallery', space: 'Jasper Junction', cost: '$81.45',  dateTime: '15 May 2020 11:00 pm', duration: '1 hr',  status: 'inactive' },
    { id: 'r6', client: 'Savannah Nguyen',    email: 'lawson@example.com',       venue: 'Vibe Hotel',      space: 'Ripple Reef',      cost: '$78.93',  dateTime: '15 May 2020 5:00 pm',  duration: '2 hrs', status: 'active' },
  ];

  const sharedHours: Record<string, DayHours> = {
    Monday:    { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Tuesday:   { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }, { from: '10:00 AM', to: '6:00 PM' }] },
    Wednesday: { enabled: true,  slots: [{ from: '10:00 AM', to: '6:00 PM' }] },
    Thursday:  { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Friday:    { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Saturday:  { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
    Sunday:    { enabled: true,  slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  };

  const sharedGallery = [
    '/images/venue-image1.png', '/images/venue-image2.png',
    '/images/venue-image3.png', '/images/venue-image4.png',
    '/images/venue-image5.png', '/images/venue-image6.png',
    '/images/venue-image7.png', '/images/venue-image8.png',
  ];

  // ── Venue DB ──────────────────────────────────────────────────────
  const venueDb: Record<string, VenueDetail> = {
    '1':  { id: '1',  name: 'Veilar Co.',      organization: 'AeroShift',    address: '4517 Washington Ave. Manchester, Kentucky 39495',  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '2':  { id: '2',  name: 'Socrates LLC.',   organization: 'SwiftPulse',   address: '3891 Ranchview Dr. Richardson, California 62639',  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '3':  { id: '3',  name: 'Greenbergs Inc.', organization: 'TerraNex',     address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '4':  { id: '4',  name: 'eHamblix Ltd.',   organization: 'InfraLink',    address: '6391 Elgin St. Celina, Delaware 10299',            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '5':  { id: '5',  name: 'Elvilloe',        organization: 'BioCore',      address: '1901 Thornridge Cir. Shiloh, Hawaii 81063',        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'inactive', spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '6':  { id: '6',  name: 'Alizates Co.',    organization: 'AquaSparkle',  address: '8502 Preston Rd. Inglewood, Maine 98380',          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '7':  { id: '7',  name: 'Curcee Ltd.',     organization: 'EcoFusion',    address: '2464 Royal Ln. Mesa, New Jersey 45463',            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'inactive', spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '8':  { id: '8',  name: 'Rhythm Lounge',   organization: 'StellarGlobe', address: '2118 Thornridge Cir. Syracuse, Connecticut 35624', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '9':  { id: '9',  name: 'Habidence Inc.',  organization: 'ZenithGlide',  address: '2715 Ash Dr. San Jose, South Dakota 83475',        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'blocked',  spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
    '10': { id: '10', name: 'Creative Hub',    organization: 'AeroShift',    address: '3891 Ranchview Dr. Richardson, California 62639',  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, cras pharetra mi tristique sapien vestibulum lobortis. Nam eget bibendum metus.', status: 'active',   spaceCount: 3, reservationCount: 10, revenue: '$20,480', spaces: sharedSpaces, reservations: sharedReservations, hours: sharedHours, gallery: sharedGallery },
  };

  // ── State ─────────────────────────────────────────────────────────
  let id    = $derived($page.params.id);
  let venue = $derived(venueDb[id] ?? venueDb['8']);
  let activeTab  = $state<Tab>('spaces');
  let showBlockModal = $state(false);
  let activeSpaceMenu = $state<string | null>(null);
  let hoursEdited = $state(false);

  // Hours local copy for editing
  let editableHours = $state<Record<string, DayHours>>(
    JSON.parse(JSON.stringify(sharedHours))
  );

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const timeOptions = [
    '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
    '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
    '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
  ];

  function addSlot(day: string) {
    editableHours[day].slots = [...editableHours[day].slots, { from: '6:00 AM', to: '8:00 AM' }];
    hoursEdited = true;
  }
  function removeSlot(day: string, i: number) {
    editableHours[day].slots = editableHours[day].slots.filter((_, idx) => idx !== i);
    hoursEdited = true;
  }
  function toggleDay(day: string) {
    editableHours[day].enabled = !editableHours[day].enabled;
    hoursEdited = true;
  }
  function saveHours() { hoursEdited = false; /* TODO: API */ }

  const statusBadge: Record<string, string> = {
    active:   'text-[#16a34a] bg-[#f0fdf4]',
    inactive: 'text-[#d97706] bg-[#fffbeb]',
    blocked:  'text-[#dc2626] bg-[#fef2f2]',
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'spaces',           label: 'Spaces' },
    { key: 'reservations',     label: 'Reservations' },
    { key: 'operating-hours',  label: 'Operating Hours' },
    { key: 'documents',        label: 'Documents' },
    { key: 'gallery',          label: 'Gallery' },
  ];

  // Gallery lightbox
  let lightboxSrc = $state<string | null>(null);

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }
  function getAvatarColor(name: string) {
    const c = ['bg-[#3b82f6]','bg-[#8b5cf6]','bg-[#ec4899]','bg-[#f59e0b]','bg-[#10b981]','bg-[#134e4a]'];
    return c[name.charCodeAt(0) % c.length];
  }
</script>

<svelte:head>
  <title>{venue.name} — KneesUp Admin</title>
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

<!-- Block confirm modal -->
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
        By blocking this venue, this venue will not be able to accept or receive any reservation request.
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

<!-- Space menu backdrop -->
{#if activeSpaceMenu}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-20" onclick={() => activeSpaceMenu = null}></div>
{/if}

<TopBar
  breadcrumbs={[
    { label: 'Venues', href: '/dashboard/venues' },
    { label: 'Venue Details', href: '/dashboard/venues' },
    { label: venue.name }
  ]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px]">

  <!-- ── Header card ───────────────────────────────────────────── -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] px-5 sm:px-6 py-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Venue image / avatar -->
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0
                    {getAvatarColor(venue.name)} flex items-center justify-center">
          <img src={venue.gallery[0]} alt={venue.name}
               class="w-full h-full object-cover"
               onerror={(e) => { (e.target as HTMLImageElement).style.display='none'; }}/>
          <span class="text-white font-bold text-base hidden">{getInitials(venue.name)}</span>
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-[#111827]">{venue.name}</h1>
          <span class="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full {statusBadge[venue.status]}">
            {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
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

    <!-- Venue details -->
    <div class="mt-5 pt-5 border-t border-[#f3f4f6]">
      <p class="text-xs font-semibold text-[#374151] mb-3">Venue Details</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Organization</p>
          <p class="text-sm font-semibold text-[#111827]">{venue.organization}</p>
        </div>
        <div>
          <p class="text-xs text-[#9ca3af] mb-0.5">Address</p>
          <p class="text-sm text-[#111827]">{venue.address}</p>
        </div>
      </div>
      <div>
        <p class="text-xs text-[#9ca3af] mb-0.5">Description</p>
        <p class="text-sm text-[#374151] leading-relaxed">{venue.description}</p>
      </div>
    </div>
  </div>

  <!-- ── Summary stats ─────────────────────────────────────────── -->
  <div class="grid grid-cols-3 gap-3 sm:gap-4">
    {#each [
      { label: 'SPACES',             value: venue.spaceCount,       icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
      { label: 'RESERVATIONS',       value: venue.reservationCount, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` },
      { label: 'TOTAL GROSS REVENUE', value: venue.revenue,         icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
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
        <div class="text-xl sm:text-[1.75rem] font-bold text-[#111827] leading-none">
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
          class="px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0
                 {activeTab === tab.key
                   ? 'border-[#134e4a] text-[#134e4a]'
                   : 'border-transparent text-[#6b7280] hover:text-[#374151]'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- ── SPACES TAB ─────────────────────────────────────────── -->
    {#if activeTab === 'spaces'}
      <!-- Spaces toolbar -->
      <div class="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-[#f9fafb]">
        <div class="relative max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="search" placeholder="Search"
            class="pl-8 pr-4 py-1.5 text-xs rounded-lg border border-[#e5e7eb] w-44
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
        </div>
        <div class="flex items-center gap-2 sm:ml-auto">
          <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Last 30 days
          </button>
          <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            Filter
          </button>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add Space
          </button>
        </div>
      </div>

      <!-- Spaces table desktop -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Name</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Description</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Max. Guest</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f9fafb]">
            {#each venue.spaces as space}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{space.name}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] max-w-[300px]">
                  <p class="truncate">{space.description}</p>
                </td>
                <td class="px-4 py-4 text-sm text-[#111827]">{space.maxGuest.toLocaleString()}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full {statusBadge[space.status]}">
                    {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                  </span>
                </td>
                <td class="px-4 py-4 relative">
                  <button onclick={() => activeSpaceMenu = activeSpaceMenu === space.id ? null : space.id}
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  {#if activeSpaceMenu === space.id}
                    <div class="absolute right-4 top-12 z-30 w-40 bg-white rounded-xl border border-[#e5e7eb] shadow-lg py-1 overflow-hidden">
                      <button onclick={() => activeSpaceMenu = null}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                        <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View Details
                      </button>
                      <button onclick={() => activeSpaceMenu = null}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                        <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Edit Space
                      </button>
                      <div class="my-1 border-t border-[#f3f4f6]"></div>
                      <button onclick={() => activeSpaceMenu = null}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors text-left">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete Space
                      </button>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Spaces mobile cards -->
      <div class="sm:hidden divide-y divide-[#f9fafb]">
        {#each venue.spaces as space}
          <div class="px-4 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[#111827]">{space.name}</p>
                <p class="text-xs text-[#6b7280] mt-1 line-clamp-2">{space.description}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs text-[#374151]">{space.maxGuest.toLocaleString()} guests</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full {statusBadge[space.status]}">
                    {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{venue.spaces.length} of {venue.spaceCount}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647] transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

    <!-- ── RESERVATIONS TAB ───────────────────────────────────── -->
    {:else if activeTab === 'reservations'}
      <!-- Toolbar -->
      <div class="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-[#f9fafb]">
        <div class="relative max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="search" placeholder="Search"
            class="pl-8 pr-4 py-1.5 text-xs rounded-lg border border-[#e5e7eb] w-44
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
        </div>
        <div class="flex items-center gap-2 sm:ml-auto">
          <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Last 30 days
          </button>
          <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
            Filter
          </button>
        </div>
      </div>

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
            {#each venue.reservations as res}
              <tr class="hover:bg-[#fafafa] transition-colors">
                <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{res.client}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{res.email}</td>
                <td class="px-4 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">{res.venue}</td>
                <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{res.space}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{res.cost}</td>
                <td class="px-4 py-4 text-xs text-[#6b7280] whitespace-nowrap">{res.dateTime}</td>
                <td class="px-4 py-4 text-sm text-[#111827]">{res.duration}</td>
                <td class="px-4 py-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full {statusBadge[res.status]}">
                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between">
        <p class="text-xs text-[#6b7280]">Showing 1-{venue.reservations.length} of {venue.reservationCount}</p>
        <div class="flex items-center gap-1">
          <button class="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af]" disabled>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white text-xs font-semibold">1</button>
          <button class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white hover:bg-[#243647] transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

    <!-- ── OPERATING HOURS TAB ────────────────────────────────── -->
    {:else if activeTab === 'operating-hours'}
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
                <!-- Toggle -->
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

    <!-- ── DOCUMENTS TAB ─────────────────────────────────────── -->
    {:else if activeTab === 'documents'}
      <div class="px-4 sm:px-6 py-6">
        <h3 class="text-sm font-semibold text-[#111827] mb-5">Documents</h3>

        <!-- Skeleton / empty state with placeholder blocks -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each Array(2) as _}
            <div class="rounded-xl bg-[#f3f4f6] aspect-[4/3] animate-pulse"></div>
          {/each}
        </div>

        <!-- Empty state message below -->
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

    <!-- ── GALLERY TAB ───────────────────────────────────────── -->
    {:else if activeTab === 'gallery'}
      <div class="px-4 sm:px-6 py-6">
        <h3 class="text-sm font-semibold text-[#111827] mb-5">Gallery</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {#each venue.gallery as img, i}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div
              class="rounded-xl overflow-hidden aspect-[4/3] bg-[#f3f4f6] cursor-pointer
                     hover:opacity-90 transition-opacity"
              onclick={() => lightboxSrc = img}
            >
              <img
                src={img}
                alt="Venue photo {i + 1}"
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
    {/if}

  </div>
</div>