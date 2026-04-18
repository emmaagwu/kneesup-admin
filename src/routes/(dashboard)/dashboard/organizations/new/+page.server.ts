import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createOrganization } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  throw redirect(303, '/dashboard/organizations');
};

type FieldErrors = {
  name?: string;
  ownerName?: string;
  ownerEmail?: string;
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const ownerName = String(formData.get('ownerName') ?? '').trim();
    const ownerEmail = String(formData.get('ownerEmail') ?? '').trim();
    const ownerTitle = String(formData.get('ownerTitle') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const logoURL = String(formData.get('logoURL') ?? '').trim();

    const errors: FieldErrors = {};

    if (!name) errors.name = 'Organization name is required';
    if (!ownerName) errors.ownerName = 'Owner name is required';
    if (!ownerEmail) {
      errors.ownerEmail = 'Owner email is required';
    } else if (!validateEmail(ownerEmail)) {
      errors.ownerEmail = 'Enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors,
        values: {
          name,
          ownerName,
          ownerEmail,
          ownerTitle,
          phone,
          logoURL
        }
      });
    }

    const organizationId = await createOrganization({
      name,
      ownerName,
      ownerEmail,
      ownerTitle,
      phone,
      logoURL
    });

    throw redirect(303, `/dashboard/organizations/${organizationId}`);
  }
};