<script lang="ts">
  import TopBar from '$components/layout/TopBar.svelte';
  type FormState = {
    errors?: {
      name?: string;
      ownerName?: string;
      ownerEmail?: string;
    };
    values?: Record<string, string>;
  };

  let { form }: { form?: FormState } = $props();

  const defaults = {
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerTitle: 'Owner',
    phone: '',
    logoURL: ''
  };

  const values = $derived({ ...defaults, ...(form?.values ?? {}) });
</script>

<svelte:head>
  <title>New Organization — KneesUp Admin</title>
</svelte:head>

<TopBar
  breadcrumbs={[
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: 'New Organization' }
  ]}
/>

<div class="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
  <div class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-[#111827]">Create Organization</h1>
      <p class="mt-1 text-sm text-[#6b7280]">Add the organization and its first owner so the rest of the dashboard can work off the new record immediately.</p>
    </div>
    <a
      href="/dashboard/organizations"
      class="inline-flex items-center rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
    >
      Back
    </a>
  </div>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
    <form method="POST" class="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-sm">
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-[#374151]" for="name">Organization name</label>
          <input
            id="name"
            name="name"
            value={values.name}
            class="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10 {form?.errors?.name ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}"
            placeholder="e.g. Harper Events Ltd"
          />
          {#if form?.errors?.name}
            <p class="mt-1 text-xs text-red-600">{form.errors.name}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-[#374151]" for="ownerName">Owner name</label>
          <input
            id="ownerName"
            name="ownerName"
            value={values.ownerName}
            class="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10 {form?.errors?.ownerName ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}"
            placeholder="Full name"
          />
          {#if form?.errors?.ownerName}
            <p class="mt-1 text-xs text-red-600">{form.errors.ownerName}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-[#374151]" for="ownerEmail">Owner email</label>
          <input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            value={values.ownerEmail}
            class="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10 {form?.errors?.ownerEmail ? 'border-red-400 bg-red-50' : 'border-[#e5e7eb]'}"
            placeholder="name@company.com"
          />
          {#if form?.errors?.ownerEmail}
            <p class="mt-1 text-xs text-red-600">{form.errors.ownerEmail}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-[#374151]" for="ownerTitle">Owner title</label>
          <input
            id="ownerTitle"
            name="ownerTitle"
            value={values.ownerTitle}
            class="mt-1 w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10"
            placeholder="Owner"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#374151]" for="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            value={values.phone}
            class="mt-1 w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10"
            placeholder="Optional"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-[#374151]" for="logoURL">Logo URL</label>
          <input
            id="logoURL"
            name="logoURL"
            value={values.logoURL}
            class="mt-1 w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none transition focus:border-[#213243] focus:ring-2 focus:ring-[#213243]/10"
            placeholder="Optional public image URL"
          />
        </div>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3 border-t border-[#f3f4f6] pt-5">
        <a href="/dashboard/organizations" class="text-sm font-medium text-[#6b7280] hover:text-[#374151]">
          Cancel
        </a>
        <button
          type="submit"
          class="inline-flex items-center rounded-lg bg-[#213243] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#172636]"
        >
          Create organization
        </button>
      </div>
    </form>

    <aside class="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5 sm:p-6">
      <h2 class="text-sm font-semibold text-[#111827]">What gets created</h2>
      <ul class="mt-3 space-y-3 text-sm text-[#4b5563]">
        <li>A new Firestore <span class="font-medium text-[#111827]">organization</span> document.</li>
        <li>A seeded owner member record so the org detail page has a visible contact.</li>
        <li>An empty venues array so venue onboarding can start immediately.</li>
      </ul>

      <div class="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Tip</p>
        <p class="mt-2 text-sm text-[#374151]">If you already have a public logo, paste the image URL here and it will be stored with the organization record.</p>
      </div>
    </aside>
  </div>
</div>