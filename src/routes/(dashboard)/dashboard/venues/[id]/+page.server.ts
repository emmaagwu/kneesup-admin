import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getVenueById } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
  const venue = await getVenueById(params.id);

  if (!venue) {
    throw error(404, 'Venue not found');
  }

  return { venue };
};