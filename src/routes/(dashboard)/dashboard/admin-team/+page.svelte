<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import { timeAgo, formatDate } from '$utils/helpers';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Role = 'super_admin' | 'admin' | 'support';
  type RoleVariant = 'error' | 'info' | 'neutral';

  const roleMap: Record<Role, { label: string; variant: RoleVariant }> = {
    super_admin: { label: 'Super Admin', variant: 'error' },
    admin:       { label: 'Admin',       variant: 'info' },
    support:     { label: 'Support',     variant: 'neutral' }
  };

  // ── Form state ────────────────────────────────────────────────────
  let showModal = $state(false);
  let isSubmitting = $state(false);
  let serverError = $state('');
  
  // Form fields
  let email = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let role = $state<Role>('admin');

  async function handleCreate() {
    serverError = '';
    isSubmitting = true;

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('role', role);

      const response = await fetch('?/createAdmin', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || result.type === 'error') {
        serverError = result.data?.error || 'Failed to create admin';
        return;
      }

      // Success
      showModal = false;
      email = '';
      firstName = '';
      lastName = '';
      role = 'admin';

      // Reload page to show new admin
      window.location.reload();
    } catch (err) {
      serverError = 'Failed to create admin user';
      console.error(err);
    } finally {
      isSubmitting = false;
    }
  }

  function openModal() {
    showModal = true;
    serverError = '';
  }

  function closeModal() {
    showModal = false;
    serverError = '';
    email = '';
    firstName = '';
    lastName = '';
    role = 'admin';
  }
</script>

<svelte:head>
  <title>Admin Team — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Admin Team' }]}
  actions={[{ label: '+ Add Admin', onclick: openModal, variant: 'primary' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div>
    <h1 class="text-xl font-bold text-[#111827]">Admin Team</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">
      Manage administrator access and roles.
      <span class="text-[#f59e0b]">Tip: Grant a user admin access by setting <code class="bg-gray-100 px-1 rounded">userRole: "Admin"</code> in Firestore.</span>
    </p>
  </div>

  {#if data.admins.length === 0}
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-8 text-center">
      <p class="text-sm text-[#9ca3af]">No admin users found. Add <code class="bg-gray-100 px-1 rounded">userRole: "Admin"</code> to a Firestore user document to grant access.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.admins as admin}
        <div class="bg-white rounded-xl border border-[#e5e7eb] p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-start gap-3">
            <Avatar name={admin.name} size="lg" />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="font-semibold text-[#111827] truncate">{admin.name}</p>
                <Badge variant={admin.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
                  {admin.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p class="text-xs text-[#9ca3af] truncate mt-0.5">{admin.email}</p>
              <div class="mt-3">
                <Badge variant={roleMap[admin.role as Role]?.variant ?? 'neutral'}>
                  {roleMap[admin.role as Role]?.label ?? admin.role}
                </Badge>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-[#f3f4f6] flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Joined {formatDate(admin.createdAt)}</span>
            <a href="/dashboard/admin-team/{admin.id}"
               class="text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors">
              Manage →
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Admin Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white w-full sm:w-96 sm:rounded-xl rounded-t-xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
        <h2 class="text-lg font-bold text-[#111827]">Add Admin User</h2>
        <button 
          onclick={closeModal}
          class="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4">
        {#if serverError}
          <div class="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
            <p class="text-sm text-[#991b1b]">{serverError}</p>
          </div>
        {/if}

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5">Email Address *</label>
          <input 
            type="email" 
            bind:value={email}
            placeholder="admin@example.com"
            class="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5">First Name</label>
          <input 
            type="text" 
            bind:value={firstName}
            placeholder="John"
            class="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5">Last Name</label>
          <input 
            type="text" 
            bind:value={lastName}
            placeholder="Doe"
            class="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        <!-- Role -->
        <div>
          <label class="block text-sm font-medium text-[#374151] mb-1.5">Role *</label>
          <select 
            bind:value={role}
            class="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-2 px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb]">
        <button 
          onclick={closeModal}
          class="flex-1 px-4 py-2 text-sm font-medium text-[#374151] border border-[#d1d5db] rounded-lg hover:bg-[#f3f4f6] transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          onclick={handleCreate}
          class="flex-1 px-4 py-2 text-sm font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Admin'}
        </button>
      </div>
    </div>
  </div>
{/if}
