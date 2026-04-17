<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { AdminVenue } from '$lib/server/db';

  let { data }: { data: PageData } = $props();

  type VenueStatus = 'active' | 'inactive' | 'blocked';

  const summaryStats = $derived([
    { label: 'All Venues', value: data.venues.length,                                              change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
    { label: 'Active',     value: data.venues.filter(v => v.status === 'active').length,           change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    { label: 'Inactive',   value: data.venues.filter(v => v.status === 'inactive').length,         change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    { label: 'Blocked',    value: data.venues.filter(v => v.status === 'blocked').length,          change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>` },
  ]);

  const statusColors: Record<VenueStatus, string> = {
    active:   'bg-[#f0fdf4] text-[#16a34a]',
    inactive: 'bg-[#fffbeb] text-[#d97706]',
    blocked:  'bg-[#fef2f2] text-[#dc2626]',
  };


  // ── Table state ───────────────────────────────────────────────────
  let search      = $state('');
  let activeMenu  = $state<string | null>(null);
  let currentPage = $state(1);
  const perPage   = 10;

  let filtered   = $derived((data.venues as AdminVenue[]).filter((v: AdminVenue) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.orgName.toLowerCase().includes(search.toLowerCase()) ||
    v.address.toLowerCase().includes(search.toLowerCase())
  ));
  let paginated  = $derived(filtered.slice((currentPage - 1) * perPage, currentPage * perPage));
  let totalPages = $derived(Math.ceil(filtered.length / perPage));

  function toggleMenu(id: string) { activeMenu = activeMenu === id ? null : id; }
  function closeMenu() { activeMenu = null; }

  // ── Drawer state ──────────────────────────────────────────────────
  let showDrawer  = $state(false);
  let drawerStep  = $state<1 | 2 | 3 | 4>(1);
  let isSubmitting = $state(false);
  let serverError = $state('');

  // Step 1 — Venue Details
  let venueName        = $state('');
  let venueDescription = $state('');
  let venueOrg         = $state('');
  let venueCountry     = $state('');
  let venueAddress     = $state('');
  let venueCity        = $state('');
  let venueState       = $state('');
  let venueZip         = $state('');
  let phoneNumber      = $state('');
  let email            = $state('');

  // Step 2 — Photos
  let primaryPhoto     = $state<string>(''); // Store as base64 string
  let photoPreviews    = $state<string[]>([]);
  let draggingPhotos   = $state(false);

  // Convert File to JPEG base64 (like kneesup-venues)
  async function fileToJpegBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = function (e) {
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
          ctx.drawImage(img, 0, 0);
          // Convert to JPEG with quality 0.8
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Step 3 — Operating Hours
  type DayHours = { enabled: boolean; slots: { from: string; to: string }[] };
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let hours = $state<Record<string, DayHours>>({
    Monday:    { enabled: false, slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
    Tuesday:   { enabled: true,  slots: [{ from: '06:00 AM', to: '08:00 AM' }, { from: '10:00 AM', to: '06:00 PM' }] },
    Wednesday: { enabled: true,  slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
    Thursday:  { enabled: false, slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
    Friday:    { enabled: true,  slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
    Saturday:  { enabled: true,  slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
    Sunday:    { enabled: true,  slots: [{ from: '06:00 AM', to: '08:00 AM' }] },
  });

  const timeOptions = [
    '12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM',
    '06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM',
    '06:00 PM','07:00 PM','08:00 PM','09:00 PM','10:00 PM','11:00 PM',
  ];

  function addSlot(day: string) {
    hours[day].slots = [...hours[day].slots, { from: '06:00 AM', to: '08:00 AM' }];
  }
  function removeSlot(day: string, i: number) {
    hours[day].slots = hours[day].slots.filter((_, idx) => idx !== i);
  }
  function toggleDay(day: string) {
    hours[day].enabled = !hours[day].enabled;
  }

  // Step 4 — Layout & Additional Info
  let layoutImage    = $state<File | null>(null);
  let layoutPreview  = $state<string | null>(null);
  let brochure       = $state<File | null>(null);
  let brochureName   = $state<string | null>(null);
  let additionalNotes = $state('');
  let draggingLayout  = $state(false);
  let draggingBrochure = $state(false);

  // Step 1 errors
  let step1Errors = $state({ venueName: '', venueOrg: '', venueCountry: '', venueAddress: '', venueCity: '', venueState: '', venueZip: '' });

  // Toast
  let showToast  = $state(false);
  let toastTimer: ReturnType<typeof setTimeout>;

  function openDrawer() {
    showDrawer = true; drawerStep = 1;
    venueName = ''; venueDescription = ''; venueOrg = ''; venueCountry = '';
    venueAddress = ''; venueCity = ''; venueState = ''; venueZip = '';
    phoneNumber = ''; email = '';
    venuePhotos = []; photoPreviews = []; primaryPhoto = null;
    layoutImage = null; layoutPreview = null; brochure = null; brochureName = null; additionalNotes = '';
    step1Errors = { venueName: '', venueOrg: '', venueCountry: '', venueAddress: '', venueCity: '', venueState: '', venueZip: '' };
    serverError = '';
  }
  function closeDrawer() { showDrawer = false; }

  function goToStep(s: 1 | 2 | 3 | 4) {
    if (s < drawerStep) { drawerStep = s; return; }
    if (drawerStep === 1 && s === 2 && !validateStep1()) return;
    drawerStep = s;
  }

  function validateStep1(): boolean {
    step1Errors = {
      venueName:    venueName.trim()    ? '' : 'Venue name is required',
      venueOrg:     venueOrg.trim()     ? '' : 'Organization is required',
      venueCountry: venueCountry.trim() ? '' : 'Country is required',
      venueAddress: venueAddress.trim() ? '' : 'Address is required',
      venueCity:    venueCity.trim()    ? '' : 'City is required',
      venueState:   venueState.trim()   ? '' : 'State is required',
      venueZip:     venueZip.trim()     ? '' : 'Zip code is required',
    };
    return Object.values(step1Errors).every(e => !e);
  }

  function handleContinue() {
    if (drawerStep === 1 && !validateStep1()) return;
    if (drawerStep < 4) drawerStep = (drawerStep + 1) as 1|2|3|4;
  }

  async function handleSubmit() {
    if (!validateStep1()) return;

    isSubmitting = true;
    serverError = '';

    // Create FormData for submission
    const formData = new FormData();
    formData.append('venueName', venueName);
    formData.append('venueDescription', venueDescription);
    formData.append('venueOrg', venueOrg);
    formData.append('venueCountry', venueCountry);
    formData.append('venueAddress', venueAddress);
    formData.append('venueCity', venueCity);
    formData.append('venueState', venueState);
    formData.append('venueZip', venueZip);
    formData.append('phoneNumber', phoneNumber);
    formData.append('email', email);
    
    // Add primary photo if available (as base64)
    if (primaryPhoto) {
      formData.append('photo', primaryPhoto);
    }

    try {
      const response = await fetch('?/createVenue', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.type === 'success' || result.data?.success) {
        closeDrawer();
        clearTimeout(toastTimer);
        showToast = true;
        toastTimer = setTimeout(() => showToast = false, 5000);
        
        // Reload venues
        window.location.reload();
      } else {
        serverError = result.data?.error || 'Failed to create venue';
      }
    } catch (error) {
      console.error('Error:', error);
      serverError = 'An error occurred. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handlePhotoFiles(files: FileList | null) {
    if (!files) return;
    
    // Only handle first file as primary photo (base64)
    const file = files[0];
    if (file) {
      try {
        primaryPhoto = await fileToJpegBase64(file);
        photoPreviews = [primaryPhoto];
      } catch (error) {
        console.error('Error converting photo:', error);
        serverError = 'Failed to process image';
      }
    }
  }

  function handleLayoutFile(file: File) {
    layoutImage = file;
    const reader = new FileReader();
    reader.onload = (e) => { layoutPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  function handleBrochureFile(file: File) {
    brochure = file; brochureName = file.name;
  }

  const organizations = $derived(data.organizations ?? []);
  const countries = ['United States', 'United Kingdom', 'Nigeria', 'Canada', 'Australia'];
  const usStates = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
</script>

<svelte:head>
  <title>Venues — KneesUp Admin</title>
</svelte:head>

<!-- Close menus on outside click -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
{#if activeMenu}
  <div class="fixed inset-0 z-20" onclick={closeMenu}></div>
{/if}

<!-- ── Backdrop + Drawer ──────────────────────────────────────────── -->
{#if showDrawer}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1.5px]" onclick={closeDrawer}></div>

  <div
    class="fixed z-50 bg-white shadow-2xl flex flex-col drawer-slide-in
           inset-0 sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[520px] sm:rounded-2xl"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Drawer breadcrumb bar -->
    <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#f0f0f0] shrink-0">
      <nav class="flex items-center gap-1.5 text-xs text-[#9ca3af]">
        <a href="/dashboard/venues" class="hover:text-[#374151] transition-colors">Venue</a>
        <span>/</span>
        <span class="text-[#111827] font-medium">New Venue</span>
      </nav>
      <button
        onclick={closeDrawer}
        class="w-7 h-7 flex items-center justify-center rounded-full text-[#9ca3af]
               hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Drawer header -->
    <div class="px-4 sm:px-6 pt-5 pb-4 shrink-0">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-[#111827]">Create New Venue</h2>
          <p class="text-sm text-[#9ca3af] mt-1">Create new venue</p>
        </div>
        <!-- 4-step indicators -->
        <div class="flex items-center gap-1.5 shrink-0 mt-1">
          {#each ([1,2,3,4] as const) as s}
            <button
              onclick={() => goToStep(s)}
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                     border-2 transition-all duration-150
                     {drawerStep === s
                       ? 'bg-[#1a2e3b] border-[#1a2e3b] text-white'
                       : drawerStep > s
                         ? 'bg-[#1a2e3b] border-[#1a2e3b] text-white opacity-60'
                         : 'border-[#e5e7eb] text-[#9ca3af] hover:border-[#d1d5db]'}"
            >
              {s}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Drawer body -->
    <div class="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
      {#if serverError}
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p class="text-sm text-red-700">{serverError}</p>
        </div>
      {/if}

      <!-- ── STEP 1: Venue Details ── -->
      {#if drawerStep === 1}
        <h3 class="text-sm font-semibold text-[#374151] mb-4">Venue Details</h3>

        <!-- Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-[#374151] mb-1.5">
            Name <span class="text-red-500">*</span>
          </label>
          <input type="text" bind:value={venueName} placeholder="Enter venue name"
            class="w-full px-4 py-2.5 text-sm rounded-lg border
                   {step1Errors.venueName ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
          {#if step1Errors.venueName}<p class="text-xs text-red-500 mt-1">{step1Errors.venueName}</p>{/if}
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-[#374151] mb-1.5">
            Description <span class="text-red-500">*</span>
          </label>
          <textarea bind:value={venueDescription} placeholder="Enter venue description" rows="4"
            class="w-full px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] resize-none
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
        </div>

        <!-- Organization -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-[#374151] mb-1.5">
            Organization <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <select bind:value={venueOrg}
              class="w-full px-4 py-2.5 text-sm rounded-lg border appearance-none
                     {step1Errors.venueOrg ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white text-[#374151]">
              <option value="" disabled selected>Select organization</option>
              {#each organizations as org}<option value={org}>{org}</option>{/each}
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          {#if step1Errors.venueOrg}<p class="text-xs text-red-500 mt-1">{step1Errors.venueOrg}</p>{/if}
        </div>

        <!-- Country -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-[#374151] mb-1.5">
            Country <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <select bind:value={venueCountry}
              class="w-full px-4 py-2.5 text-sm rounded-lg border appearance-none
                     {step1Errors.venueCountry ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white text-[#374151]">
              <option value="" disabled selected>Select Country</option>
              {#each countries as c}<option value={c}>{c}</option>{/each}
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          {#if step1Errors.venueCountry}<p class="text-xs text-red-500 mt-1">{step1Errors.venueCountry}</p>{/if}
        </div>

        <!-- Address -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-[#374151] mb-1.5">
            Address <span class="text-red-500">*</span>
          </label>
          <input type="text" bind:value={venueAddress} placeholder="Enter venue addresss"
            class="w-full px-4 py-2.5 text-sm rounded-lg border
                   {step1Errors.venueAddress ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
          {#if step1Errors.venueAddress}<p class="text-xs text-red-500 mt-1">{step1Errors.venueAddress}</p>{/if}
        </div>

        <!-- City / State / Zip -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              City <span class="text-red-500">*</span>
            </label>
            <input type="text" bind:value={venueCity} placeholder="Enter City"
              class="w-full px-3 py-2.5 text-sm rounded-lg border
                     {step1Errors.venueCity ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
            {#if step1Errors.venueCity}<p class="text-xs text-red-500 mt-1">{step1Errors.venueCity}</p>{/if}
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              State <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select bind:value={venueState}
                class="w-full px-3 py-2.5 text-sm rounded-lg border appearance-none
                       {step1Errors.venueState ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                       focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white text-[#374151]">
                <option value="" disabled selected>Select State</option>
                {#each usStates as s}<option value={s}>{s}</option>{/each}
              </select>
              <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
            {#if step1Errors.venueState}<p class="text-xs text-red-500 mt-1">{step1Errors.venueState}</p>{/if}
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Zip Code <span class="text-red-500">*</span>
            </label>
            <input type="text" bind:value={venueZip} placeholder="Enter Zip Code"
              class="w-full px-3 py-2.5 text-sm rounded-lg border
                     {step1Errors.venueZip ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
            {#if step1Errors.venueZip}<p class="text-xs text-red-500 mt-1">{step1Errors.venueZip}</p>{/if}
          </div>
        </div>

      <!-- ── STEP 2: Add Venue Photos ── -->
      {:else if drawerStep === 2}
        <h3 class="text-sm font-semibold text-[#374151] mb-4">Add Venue Photos</h3>

        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                 {draggingPhotos ? 'border-[#0d9488] bg-[#f0fdf4]' : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-[#fafafa]'}"
          ondragover={(e) => { e.preventDefault(); draggingPhotos = true; }}
          ondragleave={() => draggingPhotos = false}
          ondrop={(e) => { e.preventDefault(); draggingPhotos = false; handlePhotoFiles(e.dataTransfer?.files ?? null); }}
          onclick={() => document.getElementById('photos-input')?.click()}
        >
          <div class="flex justify-center mb-3">
            <svg class="w-10 h-10 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-[#374151] mb-1">Select a file or drag and drop here</p>
          <p class="text-xs text-[#9ca3af] mb-4">JPG, PNG or PDF, file size no more than 10MB</p>
          <button type="button"
            onclick={(e) => { e.stopPropagation(); document.getElementById('photos-input')?.click(); }}
            class="px-4 py-2 text-xs font-semibold rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-white transition-colors">
            Select file
          </button>
          <input id="photos-input" type="file" accept="image/*" multiple class="hidden"
            onchange={(e) => handlePhotoFiles((e.target as HTMLInputElement).files)}/>
        </div>

        {#if photoPreviews.length > 0}
          <div class="mt-4 grid grid-cols-3 gap-2">
            {#each photoPreviews as preview, i}
              <div class="relative rounded-lg overflow-hidden aspect-square">
                <img src={preview} alt="Photo {i+1}" class="w-full h-full object-cover"/>
                <button
                  onclick={() => { photoPreviews = photoPreviews.filter((_,idx) => idx !== i); venuePhotos = venuePhotos.filter((_,idx) => idx !== i); }}
                  class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <p class="text-xs text-[#9ca3af] mt-3">We recommend adding 10 or more high quality photos.</p>

      <!-- ── STEP 3: Operating Hours ── -->
      {:else if drawerStep === 3}
        <h3 class="text-sm font-semibold text-[#374151] mb-5">Operating Hours</h3>

        <div class="space-y-4">
          {#each days as day}
            <div>
              <div class="flex items-center justify-between">
                <!-- Day label + toggle -->
                <div class="flex items-center gap-3 w-28 shrink-0">
                  <span class="text-sm font-medium text-[#374151] w-20">{day}</span>
                  <!-- Toggle switch -->
                  <button
                    type="button"
                    onclick={() => toggleDay(day)}
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                           {hours[day].enabled ? 'bg-[#134e4a]' : 'bg-[#d1d5db]'}"
                  >
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                                 {hours[day].enabled ? 'translate-x-6' : 'translate-x-1'}"/>
                  </button>
                </div>

                {#if !hours[day].enabled}
                  <span class="text-sm text-[#9ca3af] ml-auto">Closed</span>
                {/if}
              </div>

              {#if hours[day].enabled}
                <div class="mt-2 space-y-2 pl-0">
                  {#each hours[day].slots as slot, i}
                    <div class="flex items-center gap-2 flex-wrap">
                      <!-- From -->
                      <div class="relative">
                        <select bind:value={slot.from}
                          class="pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>

                      <span class="text-xs text-[#6b7280]">to</span>

                      <!-- To -->
                      <div class="relative">
                        <select bind:value={slot.to}
                          class="pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#e5e7eb] appearance-none
                                 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]">
                          {#each timeOptions as t}<option>{t}</option>{/each}
                        </select>
                        <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>

                      <!-- Remove slot -->
                      {#if hours[day].slots.length > 1}
                        <button onclick={() => removeSlot(day, i)}
                          class="text-[#9ca3af] hover:text-[#dc2626] transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      {/if}

                      <!-- Add slot (on last slot) -->
                      {#if i === hours[day].slots.length - 1}
                        <button onclick={() => addSlot(day)}
                          class="w-6 h-6 rounded-md border border-[#e5e7eb] flex items-center justify-center
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

      <!-- ── STEP 4: Layout & Additional Info ── -->
      {:else if drawerStep === 4}
        <h3 class="text-sm font-semibold text-[#374151] mb-4">Venue Layout & Additional Information</h3>

        <!-- Layout Image -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-[#374151] mb-2">Layout Image</label>
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                   {draggingLayout ? 'border-[#0d9488] bg-[#f0fdf4]' : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-[#fafafa]'}"
            ondragover={(e) => { e.preventDefault(); draggingLayout = true; }}
            ondragleave={() => draggingLayout = false}
            ondrop={(e) => { e.preventDefault(); draggingLayout = false; if (e.dataTransfer?.files?.[0]) handleLayoutFile(e.dataTransfer.files[0]); }}
            onclick={() => document.getElementById('layout-input')?.click()}
          >
            {#if layoutPreview}
              <img src={layoutPreview} alt="Layout" class="max-h-32 mx-auto rounded-lg object-contain mb-2"/>
              <p class="text-xs text-[#6b7280]">{layoutImage?.name}</p>
            {:else}
              <div class="flex justify-center mb-2">
                <svg class="w-9 h-9 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-[#374151] mb-1">Select a file or drag and drop here</p>
              <p class="text-xs text-[#9ca3af] mb-3">JPG, PNG or PDF, file size no more than 10MB</p>
              <button type="button"
                onclick={(e) => { e.stopPropagation(); document.getElementById('layout-input')?.click(); }}
                class="px-4 py-1.5 text-xs font-semibold rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-white transition-colors">
                Select file
              </button>
            {/if}
            <input id="layout-input" type="file" accept="image/*,.pdf" class="hidden"
              onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleLayoutFile(f); }}/>
          </div>
        </div>

        <!-- Venue Brochure -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-[#374151] mb-2">Venue Brochure</label>
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                   {draggingBrochure ? 'border-[#0d9488] bg-[#f0fdf4]' : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-[#fafafa]'}"
            ondragover={(e) => { e.preventDefault(); draggingBrochure = true; }}
            ondragleave={() => draggingBrochure = false}
            ondrop={(e) => { e.preventDefault(); draggingBrochure = false; if (e.dataTransfer?.files?.[0]) handleBrochureFile(e.dataTransfer.files[0]); }}
            onclick={() => document.getElementById('brochure-input')?.click()}
          >
            {#if brochureName}
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-xs text-[#374151] font-medium">{brochureName}</p>
              </div>
            {:else}
              <div class="flex justify-center mb-2">
                <svg class="w-9 h-9 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-[#374151] mb-1">Select a file or drag and drop here</p>
              <p class="text-xs text-[#9ca3af] mb-3">DOCX or PDF, file size no more than 10MB</p>
              <button type="button"
                onclick={(e) => { e.stopPropagation(); document.getElementById('brochure-input')?.click(); }}
                class="px-4 py-1.5 text-xs font-semibold rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-white transition-colors">
                Select file
              </button>
            {/if}
            <input id="brochure-input" type="file" accept=".pdf,.docx" class="hidden"
              onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleBrochureFile(f); }}/>
          </div>
        </div>

        <!-- Additional Notes -->
        <div>
          <label class="block text-sm font-medium text-[#374151] mb-2">Additional Notes</label>
          <textarea bind:value={additionalNotes} placeholder="Additional notes" rows="4"
            class="w-full px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] resize-none
                   focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-[#9ca3af]"/>
        </div>
      {/if}
    </div>

    <!-- Drawer footer -->
    <div class="px-4 sm:px-6 py-4 border-t border-[#f0f0f0] flex items-center justify-end gap-4 shrink-0 bg-white">
      <button 
        onclick={closeDrawer}
        disabled={isSubmitting}
        class="text-sm font-semibold text-[#dc2626] underline underline-offset-2 
              hover:text-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Cancel
      </button>
      {#if drawerStep < 4}
        <button 
          onclick={handleContinue}
          disabled={isSubmitting}
          class="px-6 py-2.5 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold 
                hover:bg-[#243647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Continue
        </button>
      {:else}
        <button 
          onclick={handleSubmit}
          disabled={isSubmitting}
          class="px-6 py-2.5 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold 
                hover:bg-[#243647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2">
          {#if isSubmitting}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          {/if}
          {isSubmitting ? 'Creating...' : 'Submit'}
        </button>
      {/if}
    </div>
  </div>
{/if}

<!-- ── Toast ──────────────────────────────────────────────────────── -->
{#if showToast}
  <div class="fixed bottom-6 right-6 z-50 toast-slide-in">
    <div class="flex items-start gap-3 bg-white rounded-xl border border-[#e5e7eb]
                shadow-lg shadow-black/10 px-4 py-3.5 max-w-sm">
      <div class="w-9 h-9 rounded-full bg-[#f0fdf4] border-2 border-[#16a34a]
                  flex items-center justify-center shrink-0 mt-0.5">
        <svg class="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[#111827]">Venue Created Successfully</p>
        <p class="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
          The venue has been created and is now live on the platform.
        </p>
      </div>
      <button onclick={() => showToast = false}
        class="text-[#9ca3af] hover:text-[#374151] transition-colors shrink-0 mt-0.5">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<TopBar
  breadcrumbs={[{ label: 'Venues', href: '/dashboard/venues' }, { label: 'All Venues' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px]">

  <!-- Heading + CTA -->
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-xl sm:text-2xl font-bold text-[#111827]">Venues</h1>
    <button onclick={openDrawer}
      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
             bg-[#1a2e3b] text-white hover:bg-[#243647] transition-colors shrink-0">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      New Venue
    </button>
  </div>

  <!-- Summary stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {#each summaryStats as stat}
      <div class="bg-white rounded-xl border border-[#e5e7eb] p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] leading-tight">
            {stat.label}
          </span>
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] shrink-0">
            {@html stat.icon}
          </div>
        </div>
        <div class="text-2xl sm:text-[1.75rem] font-bold text-[#111827] leading-none mb-2">{stat.value}</div>
        <div class="flex items-center gap-1">
          <svg class="w-3 h-3 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
          </svg>
          <span class="text-xs font-semibold text-[#16a34a]">+{stat.change}%</span>
          <span class="text-xs text-[#9ca3af]">vs last week</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Table card -->
  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">

    <!-- Toolbar -->
    <div class="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-[#f0f0f0]">
      <div class="relative flex-1 max-w-xs">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="search" placeholder="Search" bind:value={search}
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#e5e7eb]
                 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                 placeholder:text-[#9ca3af] bg-white"/>
      </div>
      <div class="flex items-center gap-2 sm:ml-auto">
        <button class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3.5 h-3.5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Last 30 days
        </button>
        <button class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          <svg class="w-3.5 h-3.5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
          </svg>
          Filter
        </button>
      </div>
    </div>

    <!-- Desktop table -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6b7280]">Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Organization</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Address</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Ratings</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">No. of Spaces</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#6b7280]">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each paginated as venue}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4 text-sm font-semibold text-[#111827] whitespace-nowrap">
                <a href="/dashboard/venues/{venue.id}"
                   class="hover:text-[#0d9488] transition-colors">{venue.name}</a>
              </td>
              <td class="px-4 py-4 text-sm text-[#6b7280] whitespace-nowrap">{venue.orgName}</td>
              <td class="px-4 py-4 text-sm text-[#6b7280] max-w-[220px] truncate">{venue.address}</td>
              <td class="px-4 py-4 text-sm text-[#111827]">—</td>
              <td class="px-4 py-4 text-sm text-[#111827]">{venue.spacesCount}</td>
              <td class="px-4 py-4">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full {statusColors[venue.status as VenueStatus] ?? 'bg-gray-100 text-gray-600'}">
                  {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                </span>
              </td>
              <td class="px-4 py-4 relative">
                <button onclick={() => toggleMenu(venue.id)}
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af]
                         hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
                {#if activeMenu === venue.id}
                  <div class="absolute right-4 top-12 z-30 w-44 bg-white rounded-xl border border-[#e5e7eb]
                               shadow-lg shadow-black/5 py-1 overflow-hidden">
                    <button onclick={() => { goto(`/dashboard/venues/${venue.id}`); closeMenu(); }}
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                      <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      View Details
                    </button>
                    <button onclick={() => { goto(`/dashboard/venues/${venue.id}/edit`); closeMenu(); }}
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                      <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit Venue
                    </button>
                    <div class="my-1 border-t border-[#f3f4f6]"></div>
                    <button onclick={closeMenu}
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors text-left">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                      Block Venue
                    </button>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each paginated as venue}
        <div class="px-4 py-4 relative">
          <a href="/dashboard/venues/{venue.id}" class="block">
            <div class="pr-8">
              <p class="text-sm font-semibold text-[#111827]">{venue.name}</p>
              <p class="text-xs text-[#6b7280] mt-0.5">{venue.organization}</p>
              <p class="text-xs text-[#9ca3af] mt-0.5 truncate">{venue.address}</p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs text-[#374151]">⭐ {venue.rating}</span>
                <span class="text-xs text-[#9ca3af]">{venue.spaces} spaces</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {statusColors[venue.status]}">
                  {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                </span>
              </div>
            </div>
          </a>
          <div class="absolute right-4 top-4">
            <button onclick={() => toggleMenu(venue.id)}
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {#if activeMenu === venue.id}
              <div class="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl border border-[#e5e7eb] shadow-lg shadow-black/5 py-1 overflow-hidden">
                <button onclick={() => { goto(`/dashboard/venues/${venue.id}`); closeMenu(); }}
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                  <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  View Details
                </button>
                <button onclick={() => { goto(`/dashboard/venues/${venue.id}/edit`); closeMenu(); }}
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                  <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Venue
                </button>
                <div class="my-1 border-t border-[#f3f4f6]"></div>
                <button onclick={closeMenu}
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors text-left">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  Block Venue
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    <div class="px-4 sm:px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between gap-4">
      <p class="text-xs text-[#6b7280]">
        Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
      </p>
      <div class="flex items-center gap-1">
        <button onclick={() => currentPage = Math.max(1, currentPage - 1)} disabled={currentPage === 1}
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e7eb]
                 text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
          <button onclick={() => currentPage = p}
            class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                   {currentPage === p ? 'bg-[#1a2e3b] text-white' : 'text-[#374151] hover:bg-[#f9fafb] border border-[#e5e7eb]'}">
            {p}
          </button>
        {/each}
        <button onclick={() => currentPage = Math.min(totalPages, currentPage + 1)} disabled={currentPage === totalPages}
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white
                 hover:bg-[#243647] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .drawer-slide-in {
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
  .toast-slide-in {
    animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>