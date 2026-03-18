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
</script>

<svelte:head>
  <title>Admin Team — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Admin Team' }]}
  actions={[{ label: '+ Add Admin', href: '/dashboard/admin-team/new', variant: 'primary' }]}
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
