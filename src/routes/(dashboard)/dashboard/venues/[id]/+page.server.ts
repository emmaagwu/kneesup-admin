import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllOrganizations, getVenueById, updateVenueById } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
  const [venue, organizations] = await Promise.all([
    getVenueById(params.id),
    getAllOrganizations()
  ]);

  if (!venue) {
    throw error(404, 'Venue not found');
  }

  return { venue, organizations };
};

export const actions: Actions = {
  updateVenue: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update venues.' });
    }

    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const orgId = String(formData.get('orgId') ?? '').trim();
    const country = String(formData.get('country') ?? '').trim();
    const address = String(formData.get('address') ?? '').trim();
    const city = String(formData.get('city') ?? '').trim();
    const state = String(formData.get('state') ?? '').trim();
    const zip = String(formData.get('zip') ?? '').trim();
    const status = String(formData.get('status') ?? 'active').trim() as 'active' | 'inactive' | 'blocked';

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

    try {
      await updateVenueById(params.id, {
        name,
        description,
        orgId,
        country,
        address,
        city,
        state,
        zip,
        status
      });

      return { successMessage: 'Venue updated successfully.' };
    } catch (error_) {
      return fail(500, { errorMessage: error_ instanceof Error ? error_.message : 'Failed to update venue.' });
    }
  }
};