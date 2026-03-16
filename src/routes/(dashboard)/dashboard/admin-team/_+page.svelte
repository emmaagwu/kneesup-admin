<script lang="ts">
  import TopBar from '$lib/components/layout/TopBar.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { formatDate, timeAgo } from '$lib/utils/helpers';

  type Role = 'super_admin' | 'admin' | 'support';
  type RoleVariant = 'error' | 'info' | 'neutral';

  const roleMap: Record<Role, { label: string; variant: RoleVariant }> = {
    super_admin: { label: 'Super Admin', variant: 'error' },
    admin: { label: 'Admin', variant: 'info' },
    support: { label: 'Support', variant: 'neutral' }
  };

  const admins = [
    { id: 'a-1', name: 'Opeyemi Adesina', email: 'opeyemi@kneesupvenues.com', role: 'super_admin' as Role, status: 'active', lastActive: '2025-03-14T10:30:00', createdAt: '2024-01-01' },
    { id: 'a-2', name: 'Tunde Bakare', email: 'tunde@kneesupvenues.com', role: 'admin' as Role, status: 'active', lastActive: '2025-03-13T16:00:00', createdAt: '2024-02-15' },
    { id: 'a-3', name: 'Amaka Ihejirika', email: 'amaka@kneesupvenues.com', role: 'admin' as Role, status: 'active', lastActive: '2025-03-12T09:00:00', createdAt: '2024-03-01' },
    { id: 'a-4', name: 'Biodun Olu', email: 'biodun@kneesupvenues.com', role: 'support' as Role, status: 'active', lastActive: '2025-03-10T14:00:00', createdAt: '2024-04-10' },
    { id: 'a-5', name: 'Grace Nkemelu', email: 'grace@kneesupvenues.com', role: 'support' as Role, status: 'inactive', lastActive: '2025-02-20T11:00:00', createdAt: '2024-05-01' }
  ];
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
    <p class="text-sm text-[#9ca3af] mt-0.5">Manage administrator access and roles.</p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each admins as admin}
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
              <Badge variant={roleMap[admin.role].variant}>
                {roleMap[admin.role].label}
              </Badge>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-[#f3f4f6] flex items-center justify-between text-xs text-[#9ca3af]">
          <span>Last active {timeAgo(admin.lastActive)}</span>
          <a href="/dashboard/admin-team/{admin.id}"
             class="text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors">
            Manage →
          </a>
        </div>
      </div>
    {/each}
  </div>
</div>

// change the admin team page to use the admin team layout