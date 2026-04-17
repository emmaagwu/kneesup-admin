import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { error } from '@sveltejs/kit';
import {
  getOrganizationById,
  getVenuesByOrganizationId,
  getReservationsByOrganizationId,
  getOrganizationActivityById,
  getOrganizationPeopleById,
  updateOrganizationById
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

export const actions: Actions = {
  updateOrganization: async ({ request, params }) => {
    const formData = await request.formData();

    const name = String(formData.get('name') ?? '').trim();
    const ownerName = String(formData.get('ownerName') ?? '').trim();
    const ownerEmail = String(formData.get('ownerEmail') ?? '').trim();
    const ownerTitle = String(formData.get('ownerTitle') ?? '').trim();
    const ownerUserId = String(formData.get('ownerUserId') ?? '').trim();

    if (!name) {
      return { errorMessage: 'Organization name is required.' };
    }

    if (!ownerName) {
      return { errorMessage: 'Owner name is required.' };
    }

    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return { errorMessage: 'A valid owner email is required.' };
    }

    await updateOrganizationById(params.id, {
      name,
      ownerUserId,
      ownerName,
      ownerEmail,
      ownerTitle: ownerTitle || 'Owner'
    });

    return {
      successMessage: 'Organization updated successfully.'
    };
  }
};