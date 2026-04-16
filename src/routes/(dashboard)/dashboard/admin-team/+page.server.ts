import type { PageServerLoad, Actions } from './$types';
import { getAdminTeam, createAdmin } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const admins = await getAdminTeam();
  return { admins };
};

export const actions: Actions = {
  createAdmin: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const role = formData.get('role') as string;

    // Validation
    if (!email || !email.includes('@')) {
      return fail(400, { error: 'Invalid email address' });
    }

    if (!role || !['super_admin', 'admin', 'support'].includes(role)) {
      return fail(400, { error: 'Invalid role selected' });
    }

    try {
      const adminId = await createAdmin({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role: role as 'super_admin' | 'admin' | 'support'
      });

      return {
        success: true,
        adminId,
        message: `Admin user ${email} created successfully`
      };
    } catch (err) {
      console.error('Error creating admin:', err);
      return fail(500, { error: 'Failed to create admin user' });
    }
  }
};
