import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createVenue, deleteVenuesCascade, getAllOrganizations, getAllVenues, previewDeleteVenuesCascade } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const [venues, organizations] = await Promise.all([
    getAllVenues(),
    getAllOrganizations()
  ]);

  return { venues, organizations, canDelete: locals.user?.role === 'developer' };
};

export const actions: Actions = {
  createVenue: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to create venues.' });
    }

    const formData = await request.formData();
    const name = String(formData.get('venueName') ?? '').trim();
    const description = String(formData.get('venueDescription') ?? '').trim();
    const orgId = String(formData.get('venueOrg') ?? '').trim();
    const country = String(formData.get('venueCountry') ?? '').trim();
    const address = String(formData.get('venueAddress') ?? '').trim();
    const city = String(formData.get('venueCity') ?? '').trim();
    const state = String(formData.get('venueState') ?? '').trim();
    const zip = String(formData.get('venueZip') ?? '').trim();
    const phoneNumber = String(formData.get('phoneNumber') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const photoURL = String(formData.get('photo') ?? '').trim();

    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Venue name is required';
    if (!orgId) errors.orgId = 'Organization is required';
    if (!country) errors.country = 'Country is required';
    if (!address) errors.address = 'Address is required';
    if (!city) errors.city = 'City is required';
    if (!state) errors.state = 'State is required';
    if (!zip) errors.zip = 'Zip code is required';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errorMessage: Object.values(errors)[0], errors });
    }

    const venueId = await createVenue({
      name,
      description,
      orgId,
      country,
      address,
      city,
      state,
      zip,
      phoneNumber,
      email,
      photoURL
    });

    return {
      successMessage: 'Venue created successfully.',
      venueId
    };
  },

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
