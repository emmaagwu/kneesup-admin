<script lang="ts">
  import TopBar from '$lib/components/layout/TopBar.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { formatDateTime } from '$lib/utils/helpers';

  const logs = [
    { id: 'log-1', admin: 'Opeyemi Adesina', email: 'opeyemi@kneesupvenues.com', action: 'SUSPENDED_ORG', resource: 'Organization', resourceId: 'VIsland Events', timestamp: '2025-03-14T10:32:00', severity: 'warning' },
    { id: 'log-2', admin: 'Tunde Bakare', email: 'tunde@kneesupvenues.com', action: 'CREATED_ADMIN', resource: 'Admin', resourceId: 'grace@kneesupvenues.com', timestamp: '2025-03-13T14:15:00', severity: 'info' },
    { id: 'log-3', admin: 'Amaka Ihejirika', email: 'amaka@kneesupvenues.com', action: 'UPDATED_VENUE', resource: 'Venue', resourceId: 'The Grand Hall', timestamp: '2025-03-12T09:45:00', severity: 'info' },
    { id: 'log-4', admin: 'Opeyemi Adesina', email: 'opeyemi@kneesupvenues.com', action: 'DELETED_RESERVATION', resource: 'Reservation', resourceId: 'RES-099', timestamp: '2025-03-11T16:22:00', severity: 'error' },
    { id: 'log-5', admin: 'Biodun Olu', email: 'biodun@kneesupvenues.com', action: 'APPROVED_ORG', resource: 'Organization', resourceId: 'Kano Spaces', timestamp: '2025-03-10T11:05:00', severity: 'success' },
    { id: 'log-6', admin: 'Tunde Bakare', email: 'tunde@kneesupvenues.com', action: 'UPDATED_SETTINGS', resource: 'Settings', resourceId: 'Platform Config', timestamp: '2025-03-09T13:00:00', severity: 'info' }
  ];

  type Severity = 'success' | 'info' | 'warning' | 'error';

  const severityMap: Record<Severity, string> = {
    success: 'bg-[#f0fdf4] text-[#15803d]',
    info: 'bg-[#eff6ff] text-[#1d4ed8]',
    warning: 'bg-[#fffbeb] text-[#b45309]',
    error: 'bg-[#fef2f2] text-[#dc2626]'
  };

  let search = '';
  $: filtered = logs.filter(l =>
    l.admin.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resourceId.toLowerCase().includes(search.toLowerCase())
  );
</script>

<svelte:head>
  <title>Audit Log — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Audit Log' }]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
  <div>
    <h1 class="text-xl font-bold text-[#111827]">Audit Log</h1>
    <p class="text-sm text-[#9ca3af] mt-0.5">Complete history of all admin actions on the platform.</p>
  </div>

  <div class="relative">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input type="text" placeholder="Search logs..." bind:value={search}
      class="w-full max-w-md pl-9 pr-4 py-2.5 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
  </div>

  <div class="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
    <!-- Desktop -->
    <div class="hidden sm:block">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#fafafa] border-b border-[#f0f0f0]">
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Admin</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Action</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Resource</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Timestamp</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f9fafb]">
          {#each filtered as log}
            <tr class="hover:bg-[#fafafa] transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-2.5">
                  <Avatar name={log.admin} size="xs" />
                  <div>
                    <p class="font-medium text-[#111827]">{log.admin}</p>
                    <p class="text-[11px] text-[#9ca3af]">{log.email}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium
                             {severityMap[log.severity as Severity]}">
                  {log.action}
                </span>
              </td>
              <td class="px-4 py-4">
                <p class="text-[#374151]">{log.resource}</p>
                <p class="text-[11px] text-[#9ca3af]">{log.resourceId}</p>
              </td>
              <td class="px-5 py-4 text-[#9ca3af] text-xs">{formatDateTime(log.timestamp)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile -->
    <div class="sm:hidden divide-y divide-[#f9fafb]">
      {#each filtered as log}
        <div class="px-4 py-4">
          <div class="flex items-start gap-3">
            <Avatar name={log.admin} size="xs" />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="font-medium text-[#111827] text-sm">{log.admin}</p>
                <span class="text-[10px] text-[#9ca3af] shrink-0">{formatDateTime(log.timestamp)}</span>
              </div>
              <span class="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium
                           {severityMap[log.severity as Severity]}">
                {log.action}
              </span>
              <p class="text-xs text-[#9ca3af] mt-1">{log.resource}: {log.resourceId}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

// change the audit log page to use the admin team layout
