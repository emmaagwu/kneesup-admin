import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { deleteOrganizationsCascade, getAllOrganizations, previewDeleteOrganizationsCascade } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const organizations = await getAllOrganizations();
  return { organizations };
};

export const actions: Actions = {
  previewSelectedOrgs: async ({ request }) => {
    const formData = await request.formData();
    const orgIds = formData.getAll('organizationIds').map((value) => String(value).trim()).filter(Boolean);
    if (orgIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one organization to preview.' });
    }

    const results = await previewDeleteOrganizationsCascade(orgIds);
    const existing = results.filter((result) => result.organizationExists);
    const missing = results.length - existing.length;

    return {
      successMessage: `Dry run complete for ${results.length} organization(s).`,
      dryRunReport: {
        organizations: existing.length,
        venues: existing.reduce((sum, result) => sum + result.venues, 0),
        reservations: existing.reduce((sum, result) => sum + result.reservations, 0),
        guests: existing.reduce((sum, result) => sum + result.guests, 0),
        detachedUsers: existing.reduce((sum, result) => sum + result.usersToDetach, 0),
        missing
      }
    };
  },

  deleteOneOrg: async ({ request }) => {
    const formData = await request.formData();
    const orgId = String(formData.get('orgId') ?? '').trim();
    if (!orgId) {
      return fail(400, { errorMessage: 'Organization id is required.' });
    }

    const results = await deleteOrganizationsCascade([orgId]);
    const result = results[0];
    if (!result?.deletedOrganization) {
      return fail(404, { errorMessage: 'Organization not found or already removed.' });
    }

    return {
      successMessage: `Deleted 1 organization with ${result.deletedVenues} venues, ${result.deletedReservations} reservations, and ${result.deletedGuests} guests.`
    };
  },

  deleteSelectedOrgs: async ({ request }) => {
    const formData = await request.formData();
    const orgIds = formData.getAll('organizationIds').map((value) => String(value).trim()).filter(Boolean);
    if (orgIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one organization to delete.' });
    }

    const results = await deleteOrganizationsCascade(orgIds);
    const deletedOrgs = results.filter((result) => result.deletedOrganization);
    const skippedOrgs = results.length - deletedOrgs.length;

    const totalVenues = deletedOrgs.reduce((sum, result) => sum + result.deletedVenues, 0);
    const totalReservations = deletedOrgs.reduce((sum, result) => sum + result.deletedReservations, 0);
    const totalGuests = deletedOrgs.reduce((sum, result) => sum + result.deletedGuests, 0);

    return {
      successMessage: `Deleted ${deletedOrgs.length} organization(s), ${totalVenues} venue(s), ${totalReservations} reservation(s), ${totalGuests} guest record(s).${skippedOrgs ? ` Skipped ${skippedOrgs} missing organization(s).` : ''}`
    };
  }
};
