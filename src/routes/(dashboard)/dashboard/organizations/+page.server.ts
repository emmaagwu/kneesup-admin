import type { PageServerLoad } from './$types';
import { getAllOrganizations } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const organizations = await getAllOrganizations();
  return { organizations };
};
