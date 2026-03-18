import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
  getOrganizationById,
  getVenuesByOrganizationId,
  getReservationsByOrganizationId,
  getOrganizationActivityById,
  getOrganizationPeopleById
} from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;

  const [organization, venues, reservations, people, activity] = await Promise.all([
    getOrganizationById(id),
    getVenuesByOrganizationId(id),
    getReservationsByOrganizationId(id),
    getOrganizationPeopleById(id),
    getOrganizationActivityById(id)
  ]);

  if (!organization) throw error(404, 'Organization not found');

  const reservationCount = reservations.length;
  const grossRevenue = reservations.reduce((sum, r) => sum + (r.amountNumber ?? 0), 0);
  const revenue = '$' + Math.round(grossRevenue).toLocaleString('en-US');

  return {
    organization,
    venues,
    reservations,
    activity,

    // new
    owner: people.owner,
    team: people.team,

    reservationCount,
    revenue
  };
};