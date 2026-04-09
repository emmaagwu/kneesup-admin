import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { deleteVenuesCascade, getAllVenues, previewDeleteVenuesCascade } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const venues = await getAllVenues();
  return { venues, canDelete: locals.user?.role === 'developer' };
};

export const actions: Actions = {
  previewSelectedVenues: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can preview deletion impact.' });
    }

    const formData = await request.formData();
    const venueIds = formData.getAll('venueIds').map((value) => String(value).trim()).filter(Boolean);
    if (venueIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one venue to preview.' });
    }

    const results = await previewDeleteVenuesCascade(venueIds);
    const existing = results.filter((result) => result.venueExists);
    const missing = results.length - existing.length;

    return {
      successMessage: `Dry run complete for ${venueIds.length} venue(s).`,
      dryRunReport: {
        venues: existing.length,
        reservations: existing.reduce((sum, result) => sum + result.reservations, 0),
        guests: existing.reduce((sum, result) => sum + result.guests, 0),
        detachedFromOrganization: existing.reduce((sum, result) => sum + result.detachedFromOrganization, 0),
        missing
      }
    };
  },

  deleteSelectedVenues: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can delete venues.' });
    }

    const formData = await request.formData();
    const venueIds = formData.getAll('venueIds').map((value) => String(value).trim()).filter(Boolean);
    if (venueIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one venue to delete.' });
    }

    const results = await deleteVenuesCascade(venueIds);
    const deleted = results.filter((result) => result.deletedVenue);
    const missing = results.length - deleted.length;

    return {
      successMessage: `Deleted ${deleted.length} venue(s), ${deleted.reduce((sum, row) => sum + row.deletedReservations, 0)} reservation(s), ${deleted.reduce((sum, row) => sum + row.deletedGuests, 0)} guest record(s).${missing ? ` Skipped ${missing} missing venue(s).` : ''}`
    };
  }
};
