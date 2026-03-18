import type { PageServerLoad } from './$types';
import { getAllVenues } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const venues = await getAllVenues();
  return { venues };
};
