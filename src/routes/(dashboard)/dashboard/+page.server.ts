import type { PageServerLoad } from './$types';
import { getPlatformStats, getRecentReservations, getTopOrganizations } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const [stats, recentReservations, topOrganizations] = await Promise.all([
    getPlatformStats(),
    getRecentReservations(5),
    getTopOrganizations(5)
  ]);

  return {
    stats,
    recentReservations,
    topOrganizations
  };
};
