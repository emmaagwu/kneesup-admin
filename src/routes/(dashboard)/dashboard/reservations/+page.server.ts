import type { PageServerLoad } from './$types';
import { getAllReservations } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const reservations = await getAllReservations();
  return { reservations };
};
