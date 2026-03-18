import type { PageServerLoad } from './$types';
import { getAdminTeam } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const admins = await getAdminTeam();
  return { admins };
};
