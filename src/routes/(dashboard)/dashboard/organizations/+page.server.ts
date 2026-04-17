import type { PageServerLoad, Actions } from './$types';
import { getAllOrganizations, createOrganization } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const organizations = await getAllOrganizations();
  return { organizations };
};

export const actions: Actions = {
  createOrg: async ({ request }) => {
    const formData = await request.formData();
    
    const orgName = formData.get('orgName') as string;
    const contactName = formData.get('contactName') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const contactTitle = formData.get('contactTitle') as string;
    const logo = formData.get('logo') as string | null; // Base64 string

    // Validation
    if (!orgName || !orgName.trim()) {
      return fail(400, { error: 'Organization name is required' });
    }

    if (!contactName || !contactName.trim()) {
      return fail(400, { error: 'Contact name is required' });
    }

    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return fail(400, { error: 'Valid email is required' });
    }

    try {
      // Create organization in Firestore
      const orgId = await createOrganization({
        name: orgName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactTitle: contactTitle?.trim() || undefined,
        logo: logo || undefined  // Pass base64 string directly
      });

      return {
        success: true,
        orgId,
        message: 'Organization created successfully'
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      return fail(500, {
        error: 'Failed to create organization. Please try again.'
      });
    }
  }
};
