<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  import Avatar from '$components/ui/Avatar.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import { timeAgo, formatDate } from '$utils/helpers';
  import type { PageData } from './$types';

  type ActionResult = {
    successMessage?: string;
    errorMessage?: string;
    dryRunReport?: {
      users: number;
      organizationsToDetach: number;
      missing: number;
      skippedProtected: number;
    };
  };

  let { data, form }: { data: PageData; form?: ActionResult } = $props();

  type Role = 'super_admin' | 'admin' | 'support';
  type RoleVariant = 'error' | 'info' | 'neutral';

  const roleMap: Record<Role, { label: string; variant: RoleVariant }> = {
    super_admin: { label: 'Super Admin', variant: 'error' },
    admin:       { label: 'Admin',       variant: 'info' },
    support:     { label: 'Support',     variant: 'neutral' }
  };

  const protectedEmails = [
    'support@kneesupcorp.com',
    'support@kneesupvenues.com',
    'chris@kneesupcorp.com'
  ];

  let selectedUserIds = $state<string[]>([]);
  const allSelected = $derived(
    data.admins.length > 0 && data.admins.every((admin) => selectedUserIds.includes(admin.id))
  );

  function toggleUser(userId: string, checked: boolean) {
    if (checked) {
      if (!selectedUserIds.includes(userId)) selectedUserIds = [...selectedUserIds, userId];
      return;
    }
    selectedUserIds = selectedUserIds.filter((id) => id !== userId);
  }

  function toggleSelectAll(checked: boolean) {
    if (!checked) {
      selectedUserIds = [];
      return;
    }
    selectedUserIds = data.admins.map((admin) => admin.id);
  }

  function confirmBulkDelete(event: SubmitEvent) {
    if (selectedUserIds.length === 0) {
      event.preventDefault();
      return;
    }
    if (!confirm(`Delete ${selectedUserIds.length} user account(s)? This cannot be undone.`)) {
      event.preventDefault();
    }
  }
</script>

<svelte:head>
  <title>Admin Team — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Admin Team' }]}
  actions={[{ label: '+ Add Admin', href: '/dashboard/admin-team/new', variant: 'primary' }]}
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
      Dry run: {form.dryRunReport.users} user(s) would be deleted, with {form.dryRunReport.organizationsToDetach} organization membership link(s) removed.{#if form.dryRunReport.missing} Missing users: {form.dryRunReport.missing}.{/if}{#if form.dryRunReport.skippedProtected} Protected active session users skipped: {form.dryRunReport.skippedProtected}.{/if}
    </div>
  {/if}

  <div>
    <h1 class="text-xl font-bold text-[#111827]">Admin Team</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">
      Manage administrator access and roles.
      <span class="text-[#f59e0b]">Tip: Grant a user admin access by setting <code class="bg-gray-100 px-1 rounded">userRole: "Admin"</code> in Firestore.</span>
    </p>
    {#if data.canDelete}
      <p class="text-xs text-[#1d4ed8] mt-2">
        Protected from deletion: {protectedEmails.join(', ')}
      </p>
    {/if}
  </div>

  {#if data.admins.length > 0 && data.canDelete}
    <div class="flex flex-wrap items-center gap-2">
      <label class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#e5e7eb] text-[#374151]">
        <input type="checkbox" checked={allSelected} onchange={(event) => toggleSelectAll((event.target as HTMLInputElement).checked)} />
        Select all
      </label>
      <form method="POST" action="?/deleteSelectedUsers" onsubmit={confirmBulkDelete}>
        {#each selectedUserIds as userId}
          <input type="hidden" name="userIds" value={userId} />
        {/each}
        <button
          type="submit"
          formaction="?/previewSelectedUsers"
          class="mr-2 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={selectedUserIds.length === 0}
        >
          Dry run ({selectedUserIds.length})
        </button>
        <button
          type="submit"
          disabled={selectedUserIds.length === 0}
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete selected ({selectedUserIds.length})
        </button>
      </form>
    </div>
  {/if}

  {#if data.admins.length === 0}
    <div class="bg-white rounded-xl border border-[#e5e7eb] p-8 text-center">
      <p class="text-sm text-[#9ca3af]">No admin users found. Add <code class="bg-gray-100 px-1 rounded">userRole: "Admin"</code> to a Firestore user document to grant access.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.admins as admin}
        <div class="bg-white rounded-xl border border-[#e5e7eb] p-5 hover:shadow-sm transition-shadow">
          {#if data.canDelete}
            <div class="mb-3">
              <label class="inline-flex items-center gap-2 text-xs text-[#6b7280]">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(admin.id)}
                  onchange={(event) => toggleUser(admin.id, (event.target as HTMLInputElement).checked)}
                />
                Select
              </label>
            </div>
          {/if}
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
          <div class="mt-4 pt-4 border-t border-[#f3f4f6] flex items-center justify-between text-xs text-[#9ca3af] gap-2">
            <span>Joined {formatDate(admin.createdAt)}</span>
            <div class="flex items-center gap-3">
              <a href="/dashboard/admin-team/{admin.id}"
                 class="text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors">
                Manage →
              </a>
              {#if data.canDelete}
                <form
                  method="POST"
                  action="?/deleteOneUser"
                  onsubmit={(event) => {
                    if (!confirm('Delete this user account? This cannot be undone.')) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="userId" value={admin.id} />
                  <button type="submit" class="font-medium text-[#b91c1c] hover:text-[#991b1b] transition-colors">
                    Delete
                  </button>
                </form>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
