import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { deleteReservationsCascade, getAllReservations, previewDeleteReservationsCascade } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const reservations = await getAllReservations();
  return { reservations, canDelete: locals.user?.role === 'developer' };
};

export const actions: Actions = {
  previewSelectedReservations: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can preview deletion impact.' });
    }

    const formData = await request.formData();
    const reservationIds = formData
      .getAll('reservationIds')
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (reservationIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one reservation to preview.' });
    }

    const results = await previewDeleteReservationsCascade(reservationIds);
    const existing = results.filter((result) => result.reservationExists);
    const missing = results.length - existing.length;

    return {
      successMessage: `Dry run complete for ${reservationIds.length} reservation(s).`,
      dryRunReport: {
        reservations: existing.length,
        guests: existing.reduce((sum, result) => sum + result.guests, 0),
        missing
      }
    };
  },

  deleteSelectedReservations: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can delete reservations.' });
    }

    const formData = await request.formData();
    const reservationIds = formData
      .getAll('reservationIds')
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (reservationIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one reservation to delete.' });
    }

    const results = await deleteReservationsCascade(reservationIds);
    const deleted = results.filter((result) => result.deletedReservation);
    const missing = results.length - deleted.length;

    return {
      successMessage: `Deleted ${deleted.length} reservation(s) and ${deleted.reduce((sum, row) => sum + row.deletedGuests, 0)} guest record(s).${missing ? ` Skipped ${missing} missing reservation(s).` : ''}`
    };
  }
};
