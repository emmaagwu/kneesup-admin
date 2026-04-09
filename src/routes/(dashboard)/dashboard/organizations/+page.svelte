<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { AdminOrganization } from '$lib/server/db';

  type ActionResult = {
    successMessage?: string;
    errorMessage?: string;
    dryRunReport?: {
      organizations: number;
      venues: number;
      reservations: number;
      guests: number;
      detachedUsers: number;
      missing: number;
    };
  };

  let { data, form }: { data: PageData; form?: ActionResult } = $props();

  type OrgStatus = 'active' | 'suspended' | 'pending';

  const summaryStats = $derived([
    { label: 'All Organizations', value: data.organizations.length, change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>` },
    { label: 'Active',            value: data.organizations.filter(o => o.status === 'active').length,    change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    { label: 'Suspended',         value: data.organizations.filter(o => o.status === 'suspended').length, change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    { label: 'Pending',           value: data.organizations.filter(o => o.status === 'pending').length,   change: 0, icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>` },
  ]);

  type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';
  const statusMap: Record<OrgStatus, { label: string; variant: StatusVariant; color: string }> = {
    active:    { label: 'Active',    variant: 'success', color: 'text-[#16a34a]' },
    suspended: { label: 'Suspended', variant: 'warning', color: 'text-[#d97706]' },
    pending:   { label: 'Pending',   variant: 'neutral', color: 'text-[#6b7280]' },
  };

  // ── Table state ───────────────────────────────────────────────────
  let search     = $state('');
  let activeMenu = $state<string | null>(null);
  let currentPage = $state(1);
  let sortBy = $state<'name' | 'email' | 'venues' | 'status'>('name');
  let sortDir = $state<'asc' | 'desc'>('asc');
  const perPage = 10;

  let filtered  = $derived(data.organizations.filter((o: AdminOrganization) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  ));

  let sorted = $derived.by(() => {
    const rows = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sortBy === 'venues') return (a.venueCount - b.venueCount) * dir;
      if (sortBy === 'status') return a.status.localeCompare(b.status) * dir;
      if (sortBy === 'email') return a.email.localeCompare(b.email) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return rows;
  });

  let paginated  = $derived(sorted.slice((currentPage - 1) * perPage, currentPage * perPage));
  let totalPages = $derived(Math.max(1, Math.ceil(sorted.length / perPage)));

  $effect(() => {
    if (currentPage > totalPages) currentPage = totalPages;
  });

  let selectedOrgIds = $state<string[]>([]);
  let allVisibleSelected = $derived(
    paginated.length > 0 && paginated.every((org) => selectedOrgIds.includes(org.id))
  );

  function toggleOrgSelection(orgId: string, checked: boolean) {
    if (checked) {
      if (!selectedOrgIds.includes(orgId)) selectedOrgIds = [...selectedOrgIds, orgId];
      return;
    }
    selectedOrgIds = selectedOrgIds.filter((id) => id !== orgId);
  }

  function toggleSelectAllVisible(checked: boolean) {
    if (!checked) {
      selectedOrgIds = selectedOrgIds.filter((id) => !paginated.some((org) => org.id === id));
      return;
    }
    const merged = new Set([...selectedOrgIds, ...paginated.map((org) => org.id)]);
    selectedOrgIds = Array.from(merged);
  }

  function selectAllFilteredResults() {
    selectedOrgIds = Array.from(new Set([...selectedOrgIds, ...filtered.map((org) => org.id)]));
  }

  function selectAllDatabaseResults() {
    selectedOrgIds = data.organizations.map((org) => org.id);
  }

  function clearSelection() {
    selectedOrgIds = [];
  }

  function confirmBulkDelete(event: SubmitEvent) {
    if (selectedOrgIds.length === 0) {
      event.preventDefault();
      return;
    }
    if (!confirm(`Delete ${selectedOrgIds.length} organization(s) and related data? This cannot be undone.`)) {
      event.preventDefault();
    }
  }

  function toggleMenu(id: string) { activeMenu = activeMenu === id ? null : id; }
  function closeMenu() { activeMenu = null; }
  function formatCurrency(n: number) { return '$' + n.toLocaleString('en-US'); }

  function handleAction(action: string, org: AdminOrganization) {
    if (action === 'view') goto(`/dashboard/organizations/${org.id}`);
    if (action === 'edit') goto(`/dashboard/organizations/${org.id}/edit`);
    closeMenu();
  }

  // ── Create org drawer ─────────────────────────────────────────────
  let showDrawer = $state(false);
  let drawerStep = $state<1 | 2>(1);
  let isSubmitting = $state(false);
  let serverError = $state('');

  // Step 1 fields
  let orgName    = $state('');
  let orgPhoto   = $state<string>(''); // Store as base64 string
  let photoPreview = $state<string | null>(null);
  let dragging   = $state(false);

  // Step 2 fields
  let contactName  = $state('');
  let contactTitle = $state('');
  let contactEmail = $state('');

  // Errors
  let step1Errors = $state({ orgName: '' });
  let step2Errors = $state({ contactName: '', contactEmail: '' });

  // Toast
  let showToast   = $state(false);
  let toastTimer: ReturnType<typeof setTimeout>;

  function openDrawer() {
    showDrawer = true;
    drawerStep = 1;
    orgName = ''; orgPhoto = ''; photoPreview = null;
    contactName = ''; contactTitle = ''; contactEmail = '';
    step1Errors = { orgName: '' };
    step2Errors = { contactName: '', contactEmail: '' };
    serverError = '';
  }

  function closeDrawer() { showDrawer = false; }

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

  async function handleFileSelect(file: File) {
    if (!file) return;
    try {
      orgPhoto = await fileToJpegBase64(file);
      photoPreview = orgPhoto;
    } catch (error) {
      console.error('Error converting file:', error);
      serverError = 'Failed to process image';
    }
  }

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) handleFileSelect(input.files[0]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); dragging = false;
    if (e.dataTransfer?.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  }

  function validateStep1(): boolean {
    step1Errors = { orgName: orgName.trim() ? '' : 'Organization name is required' };
    return !step1Errors.orgName;
  }

  function validateStep2(): boolean {
    step2Errors = {
      contactName:  contactName.trim()  ? '' : 'Contact name is required',
      contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ? '' : 'Valid email is required',
    };
    return !step2Errors.contactName && !step2Errors.contactEmail;
  }

  function handleContinue() {
    if (drawerStep === 1 && validateStep1()) drawerStep = 2;
  }

  async function handleCreate() {
    if (!validateStep2()) return;

    isSubmitting = true;
    serverError = '';

    // Create FormData for submission
    const formData = new FormData();
    formData.append('orgName', orgName);
    formData.append('contactName', contactName);
    formData.append('contactEmail', contactEmail);
    formData.append('contactTitle', contactTitle);
    if (orgPhoto) {
      formData.append('logo', orgPhoto); // Send base64 string, not File
    }

    try {
      const response = await fetch('?/createOrg', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.type === 'success' || result.data?.success) {
        closeDrawer();
        clearTimeout(toastTimer);
        showToast = true;
        toastTimer = setTimeout(() => showToast = false, 5000);
        
        // Reload organizations
        window.location.reload();
      } else {
        serverError = result.data?.error || 'Failed to create organization';
      }
    } catch (error) {
      console.error('Error:', error);
      serverError = 'An error occurred. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Organizations — KneesUp Admin</title>
</svelte:head>

<!-- Close menus on outside click -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
{#if activeMenu}
  <div class="fixed inset-0 z-20" onclick={closeMenu}></div>
{/if}

<!-- ── Backdrop + Drawer ────────────────────────────────────────── -->
{#if showDrawer}
  <!-- Blurred backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1.5px]"
    onclick={closeDrawer}
  ></div>

  <!-- Drawer panel — full screen on mobile, detached with margin on desktop -->
  <div
    class="
      fixed z-50 bg-white shadow-2xl flex flex-col drawer-slide-in
      inset-0
      sm:inset-y-4 sm:right-4 sm:left-auto
      sm:w-[480px] sm:rounded-2xl
    "
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Drawer top breadcrumb bar -->
    <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#f0f0f0] shrink-0">
      <nav class="flex items-center gap-1.5 text-xs text-[#9ca3af]">
        <a href="/dashboard/organizations" class="hover:text-[#374151] transition-colors">Organizations</a>
        <span>/</span>
        <span class="text-[#111827] font-medium">New Organization</span>
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
          <h2 class="text-xl font-bold text-[#111827]">Create New Organization</h2>
          <p class="text-sm text-[#9ca3af] mt-1">Create new organization</p>
        </div>

        <!-- Step indicators — clicking step 1 goes back -->
        <div class="flex items-center gap-2 shrink-0 mt-1">
          <button
            onclick={() => drawerStep = 1}
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-colors
                  {drawerStep === 1
                    ? 'bg-[#1a2e3b] text-white'
                    : 'bg-[#e5e7eb] text-[#9ca3af] hover:bg-[#d1d5db]'}"
          >
            1
          </button>
          <button
            onclick={() => { if (validateStep1()) drawerStep = 2; }}
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                  transition-colors
                  {drawerStep === 2
                    ? 'border-[#1a2e3b] bg-[#1a2e3b] text-white'
                    : 'border-[#e5e7eb] text-[#9ca3af] hover:border-[#d1d5db]'}"
          >
            2
          </button>
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

      {#if drawerStep === 1}
        <!-- ── Step 1: Organization Details ── -->
        <div class="mb-5">
          <h3 class="text-sm font-semibold text-[#374151] mb-4">Organization Details</h3>

          <!-- Org name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={orgName}
              placeholder="Enter organization name"
              class="w-full px-4 py-2.5 text-sm rounded-lg border
                     {step1Errors.orgName ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                     placeholder:text-[#9ca3af]"
            />
            {#if step1Errors.orgName}
              <p class="text-xs text-red-500 mt-1">{step1Errors.orgName}</p>
            {/if}
          </div>

          <!-- Photo upload -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Upload Profile Photo
            </label>

            <!-- Drop zone -->
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div
              class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                     {dragging ? 'border-[#0d9488] bg-[#f0fdf4]' : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-[#fafafa]'}"
              ondragover={(e) => { e.preventDefault(); dragging = true; }}
              ondragleave={() => dragging = false}
              ondrop={onDrop}
              onclick={() => document.getElementById('file-input')?.click()}
            >
              {#if photoPreview}
                <img src={photoPreview} alt="Preview" class="w-20 h-20 rounded-full object-cover mx-auto mb-3"/>
                <p class="text-xs text-[#6b7280]">{orgPhoto?.name}</p>
              {:else}
                <!-- Upload icon -->
                <div class="flex justify-center mb-3">
                  <svg class="w-10 h-10 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p class="text-sm font-medium text-[#374151] mb-1">Select a file or drag and drop here</p>
                <p class="text-xs text-[#9ca3af] mb-4">JPG, PNG or PDF, file size no more than 10MB</p>
                <button
                  type="button"
                  onclick={(e) => { e.stopPropagation(); document.getElementById('file-input')?.click(); }}
                  class="px-4 py-2 text-xs font-semibold rounded-lg border border-[#e5e7eb]
                         text-[#374151] hover:bg-white transition-colors"
                >
                  Select file
                </button>
              {/if}
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                class="hidden"
                onchange={onFileInput}
              />
            </div>
          </div>
        </div>

      {:else}
        <!-- ── Step 2: Contact Details ── -->
        <div>
          <h3 class="text-sm font-semibold text-[#374151] mb-4">Contact's Details</h3>

          <!-- Contact name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={contactName}
              placeholder="Enter contact's name"
              class="w-full px-4 py-2.5 text-sm rounded-lg border
                     {step2Errors.contactName ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                     placeholder:text-[#9ca3af]"
            />
            {#if step2Errors.contactName}
              <p class="text-xs text-red-500 mt-1">{step2Errors.contactName}</p>
            {/if}
          </div>

          <!-- Title/Position -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Title/Position
            </label>
            <input
              type="text"
              bind:value={contactTitle}
              placeholder="Select contact's title"
              class="w-full px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb]
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                     placeholder:text-[#9ca3af]"
            />
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-[#374151] mb-1.5">
              Email Address <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              bind:value={contactEmail}
              placeholder="Enter contact's email address"
              class="w-full px-4 py-2.5 text-sm rounded-lg border
                     {step2Errors.contactEmail ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}
                     focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                     placeholder:text-[#9ca3af]"
            />
            {#if step2Errors.contactEmail}
              <p class="text-xs text-red-500 mt-1">{step2Errors.contactEmail}</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Drawer footer -->
    <div class="px-6 py-4 border-t border-[#f0f0f0] flex items-center justify-end gap-4 shrink-0 bg-white">
      <button
        onclick={closeDrawer}
        disabled={isSubmitting}
        class="text-sm font-semibold text-[#dc2626] underline underline-offset-2
              hover:text-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      {#if drawerStep === 1}
        <button
          onclick={handleContinue}
          disabled={isSubmitting}
          class="px-6 py-2.5 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold
                hover:bg-[#243647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      {:else}
        <button
          onclick={handleCreate}
          disabled={isSubmitting}
          class="px-6 py-2.5 rounded-lg bg-[#1a2e3b] text-white text-sm font-semibold
                hover:bg-[#243647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
        >
          {#if isSubmitting}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          {/if}
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      {/if}
    </div>
  </div>
{/if}

<!-- ── Toast notification ────────────────────────────────────────── -->
{#if showToast}
  <div class="fixed bottom-6 right-6 z-50 toast-slide-in">
    <div class="flex items-start gap-3 bg-white rounded-xl border border-[#e5e7eb]
                shadow-lg shadow-black/10 px-4 py-3.5 max-w-sm">
      <!-- Green check circle -->
      <div class="w-9 h-9 rounded-full bg-[#f0fdf4] border-2 border-[#16a34a]
                  flex items-center justify-center shrink-0 mt-0.5">
        <svg class="w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[#111827]">Organization Created Successfully</p>
        <p class="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
          You have successfully created an organization and login details has been sent to the contact's email address.
        </p>
      </div>
      <button
        onclick={() => showToast = false}
        class="text-[#9ca3af] hover:text-[#374151] transition-colors shrink-0 mt-0.5"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<TopBar
  breadcrumbs={[{ label: 'Organizations', href: '/dashboard/organizations' }, { label: 'All Organizations' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px]">

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
      Dry run: {form.dryRunReport.organizations} org(s), {form.dryRunReport.venues} venue(s), {form.dryRunReport.reservations} reservation(s), {form.dryRunReport.guests} guest(s), {form.dryRunReport.detachedUsers} user link(s) will be affected.{#if form.dryRunReport.missing} Missing orgs: {form.dryRunReport.missing}.{/if}
    </div>
  {/if}

  <!-- Page heading + CTA -->
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-xl sm:text-2xl font-bold text-[#111827]">Organizations</h1>
    <a
      href="/dashboard/organizations/new"
      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
             bg-[#1a2e3b] text-white hover:bg-[#243647] transition-colors shrink-0"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      New Organization
    </a>
  </div>

  <!-- Summary stat cards -->
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
        <div class="text-2xl sm:text-[1.75rem] font-bold text-[#111827] leading-none mb-2">
          {stat.value}
        </div>
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
        <input
          type="search"
          placeholder="Search"
          bind:value={search}
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#e5e7eb]
                 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent
                 placeholder:text-[#9ca3af] bg-white"
        />
      </div>
      <div class="flex items-center gap-2 sm:ml-auto">
        <label class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151]">
          Sort
          <select bind:value={sortBy} class="rounded border border-[#d1d5db] px-2 py-1 text-xs">
            <option value="name">Name</option>
            <option value="email">Owner email</option>
            <option value="venues">Venue count</option>
            <option value="status">Status</option>
          </select>
          <select bind:value={sortDir} class="rounded border border-[#d1d5db] px-2 py-1 text-xs">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </label>
        <label class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151]">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onchange={(event) => toggleSelectAllVisible((event.target as HTMLInputElement).checked)}
          />
          Select page ({paginated.length})
        </label>
        <button type="button" onclick={selectAllFilteredResults} class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          Select filtered ({filtered.length})
        </button>
        <button type="button" onclick={selectAllDatabaseResults} class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          Select all records ({data.organizations.length})
        </button>
        <button type="button" onclick={clearSelection} class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors">
          Clear
        </button>
        <form method="POST" action="?/previewSelectedOrgs">
          {#each selectedOrgIds as orgId}
            <input type="hidden" name="organizationIds" value={orgId} />
          {/each}
          <button
            type="submit"
            disabled={selectedOrgIds.length === 0}
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dry run ({selectedOrgIds.length})
          </button>
        </form>
        <form method="POST" action="?/deleteSelectedOrgs" onsubmit={confirmBulkDelete}>
          {#each selectedOrgIds as orgId}
            <input type="hidden" name="organizationIds" value={orgId} />
          {/each}
          <button
            type="submit"
            disabled={selectedOrgIds.length === 0}
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete selected ({selectedOrgIds.length})
          </button>
        </form>
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
          <tr class="border-b border-[#f0f0f0]">
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-[#6b7280] w-10">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onchange={(event) => toggleSelectAllVisible((event.target as HTMLInputElement).checked)}
              />
            </th>
            <th class="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280]">Name</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-[#6b7280]">Owner Email</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-[#6b7280]">No. of Venues</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-[#6b7280]">Status</th>
            <th class="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each paginated as org}
            <tr class="hover:bg-[#fafafa] transition-colors group">
              <td class="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedOrgIds.includes(org.id)}
                  onchange={(event) => toggleOrgSelection(org.id, (event.target as HTMLInputElement).checked)}
                />
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <a href="/dashboard/organizations/{org.id}"
                   class="text-sm font-semibold text-[#111827] hover:text-[#0d9488] transition-colors">
                  {org.name}
                </a>
              </td>
              <td class="px-4 py-4 text-sm text-[#6b7280]">{org.email || '—'}</td>
              <td class="px-4 py-4 text-sm text-[#111827]">{org.venueCount}</td>
              <td class="px-4 py-4">
                <span class="text-sm font-medium {statusMap[org.status as OrgStatus]?.color ?? 'text-[#6b7280]'}">
                  {statusMap[org.status as OrgStatus]?.label ?? org.status}
                </span>
              </td>
              <td class="px-4 py-4 relative">
                <button
                  onclick={() => toggleMenu(org.id)}
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#9ca3af]
                         hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>

                {#if activeMenu === org.id}
                  <div class="absolute right-4 top-12 z-30 w-44 bg-white rounded-xl border border-[#e5e7eb]
                               shadow-lg shadow-black/5 py-1 overflow-hidden">
                    <button onclick={() => handleAction('view', org)}
                            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                      <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      View Details
                    </button>
                    <button onclick={() => handleAction('edit', org)}
                            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                      <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit Org
                    </button>
                    <div class="my-1 border-t border-[#f3f4f6]"></div>
                    <button onclick={() => handleAction('block', org)}
                            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors text-left">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                      Block Org
                    </button>
                    <form
                      method="POST"
                      action="?/deleteOneOrg"
                      onsubmit={(event) => {
                        if (!confirm('Delete this organization and all related venues/reservations/guests? This cannot be undone.')) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="orgId" value={org.id} />
                      <button type="submit"
                              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#b91c1c] hover:bg-[#fef2f2] transition-colors text-left">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5h6v2m-7 4v6m4-6v6m5 2H7a2 2 0 01-2-2V7h14v10a2 2 0 01-2 2z"/>
                        </svg>
                        Delete Org
                      </button>
                    </form>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile card list -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each paginated as org}
        <div class="px-4 py-4 relative">
          <div class="mb-2">
            <label class="inline-flex items-center gap-2 text-xs text-[#6b7280]">
              <input
                type="checkbox"
                checked={selectedOrgIds.includes(org.id)}
                onchange={(event) => toggleOrgSelection(org.id, (event.target as HTMLInputElement).checked)}
              />
              Select
            </label>
          </div>
          <a href="/dashboard/organizations/{org.id}" class="block">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[#111827]">{org.name}</p>
                <p class="text-xs text-[#9ca3af] mt-0.5 truncate">{org.email || '—'}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs text-[#9ca3af]">{org.venueCount} venues</span>
                  <span class="text-xs font-semibold {statusMap[org.status as OrgStatus]?.color ?? 'text-[#6b7280]'}">
                    {statusMap[org.status as OrgStatus]?.label ?? org.status}
                  </span>
                </div>
              </div>
              <div class="w-8 shrink-0"></div>
            </div>
          </a>
          <div class="absolute right-4 top-4">
            <button
              onclick={() => toggleMenu(org.id)}
              class="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {#if activeMenu === org.id}
              <div class="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl border border-[#e5e7eb] shadow-lg shadow-black/5 py-1 overflow-hidden">
                <button onclick={() => handleAction('view', org)}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                  <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  View Details
                </button>
                <button onclick={() => handleAction('edit', org)}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                  <svg class="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Org
                </button>
                <div class="my-1 border-t border-[#f3f4f6]"></div>
                <button onclick={() => handleAction('block', org)}
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors text-left">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  Block Org
                </button>
                <form
                  method="POST"
                  action="?/deleteOneOrg"
                  onsubmit={(event) => {
                    if (!confirm('Delete this organization and all related venues/reservations/guests? This cannot be undone.')) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="orgId" value={org.id} />
                  <button type="submit"
                          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#b91c1c] hover:bg-[#fef2f2] transition-colors text-left">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5h6v2m-7 4v6m4-6v6m5 2H7a2 2 0 01-2-2V7h14v10a2 2 0 01-2 2z"/>
                    </svg>
                    Delete Org
                  </button>
                </form>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    <div class="px-4 sm:px-5 py-4 border-t border-[#f0f0f0] flex items-center justify-between gap-4">
      <p class="text-xs text-[#6b7280]">
        {#if sorted.length === 0}
          Showing 0 of 0
        {:else}
          Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, sorted.length)} of {sorted.length}
        {/if}
      </p>
      <div class="flex items-center gap-1">
        <button
          onclick={() => currentPage = Math.max(1, currentPage - 1)}
          disabled={currentPage === 1}
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e7eb]
                 text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
          <button
            onclick={() => currentPage = p}
            class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                   {currentPage === p ? 'bg-[#1a2e3b] text-white' : 'text-[#374151] hover:bg-[#f9fafb] border border-[#e5e7eb]'}"
          >
            {p}
          </button>
        {/each}
        <button
          onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
          disabled={currentPage === totalPages}
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2e3b] text-white
                 hover:bg-[#243647] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
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