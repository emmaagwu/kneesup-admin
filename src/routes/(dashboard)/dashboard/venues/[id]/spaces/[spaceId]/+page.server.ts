import { error } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getVenueById, updateVenueSpace } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
  const venue = await getVenueById(params.id);

  if (!venue) {
    throw error(404, 'Venue not found');
  }

  const space = venue.spaces.find((entry) => entry.id === params.spaceId);

  if (!space) {
    throw error(404, 'Space not found');
  }

  return {
    venue,
    space
  };
};

export const actions: Actions = {
  updateSpaceDetails: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update this space.' });
    }

    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const capacityRaw = String(formData.get('capacity') ?? '').trim();
    const status = String(formData.get('status') ?? 'active').trim() as 'active' | 'inactive';

    if (!name) {
      return fail(400, { errorMessage: 'Space name is required.' });
    }

    const capacityNumber = Number(capacityRaw);
    if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) {
      return fail(400, { errorMessage: 'Capacity must be a positive number.' });
    }

    await updateVenueSpace(params.id, params.spaceId, {
      name,
      description,
      maxGuests: Math.floor(capacityNumber),
      status
    });

    return { successMessage: 'Space details updated successfully.' };
  },

  updateRules: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update rules.' });
    }

    const formData = await request.formData();
    const rawRules = String(formData.get('rules') ?? '');
    const rules = rawRules.split('\n').map((rule) => rule.trim()).filter(Boolean);

    await updateVenueSpace(params.id, params.spaceId, { rules });
    return { successMessage: 'Rules updated successfully.' };
  },

  updateAmenities: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update amenities.' });
    }

    const formData = await request.formData();
    const rawAmenities = String(formData.get('amenities') ?? '');
    const amenities = rawAmenities.split('\n').map((amenity) => amenity.trim()).filter(Boolean);

    await updateVenueSpace(params.id, params.spaceId, { amenities });
    return { successMessage: 'Amenities updated successfully.' };
  },

  updatePricing: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update pricing.' });
    }

    const formData = await request.formData();
    const pricingModel = String(formData.get('pricingModel') ?? 'contact').trim() as 'hour' | 'guest' | 'flat' | 'contact';
    const hourlyRate = String(formData.get('hourlyRate') ?? '').trim();
    const minBookingHours = String(formData.get('minBookingHours') ?? '').trim();
    const maxBookingHours = String(formData.get('maxBookingHours') ?? '').trim();
    const perGuestRate = String(formData.get('perGuestRate') ?? '').trim();
    const minGuestCount = String(formData.get('minGuestCount') ?? '').trim();
    const maxGuestCount = String(formData.get('maxGuestCount') ?? '').trim();
    const flatRate = String(formData.get('flatRate') ?? '').trim();
    const whatsIncluded = String(formData.get('whatsIncluded') ?? '').trim();

    if (pricingModel === 'hour') {
      if (!hourlyRate) {
        return fail(400, { errorMessage: 'Hourly rate is required for hourly pricing.' });
      }
    }

    if (pricingModel === 'guest') {
      if (!perGuestRate) {
        return fail(400, { errorMessage: 'Per-guest price is required for guest pricing.' });
      }
    }

    if (pricingModel === 'flat') {
      if (!flatRate) {
        return fail(400, { errorMessage: 'Flat rental fee is required for flat pricing.' });
      }
    }

    await updateVenueSpace(params.id, params.spaceId, {
      pricingModel,
      hourlyRate,
      minBookingHours,
      maxBookingHours,
      perGuestRate,
      minGuestCount,
      maxGuestCount,
      flatRate,
      whatsIncluded
    });

    return { successMessage: 'Pricing updated successfully.' };
  },

  updateOperatingHours: async ({ params, request, locals }) => {
    if (!locals.user) {
      return fail(401, { errorMessage: 'You must be signed in to update operating hours.' });
    }

    const formData = await request.formData();
    const payload = String(formData.get('operatingHours') ?? '').trim();
    if (!payload) {
      return fail(400, { errorMessage: 'Operating hours payload is required.' });
    }

    let operatingHours: Record<string, { enabled: boolean; slots: Array<{ from: string; to: string }> }>;
    try {
      operatingHours = JSON.parse(payload) as Record<string, { enabled: boolean; slots: Array<{ from: string; to: string }> }>;
    } catch {
      return fail(400, { errorMessage: 'Invalid operating hours payload.' });
    }

    await updateVenueSpace(params.id, params.spaceId, { operatingHours });
    return { successMessage: 'Operating hours updated successfully.' };
  }
};
