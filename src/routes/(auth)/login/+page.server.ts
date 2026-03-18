import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Already authenticated — send straight to dashboard
  if (locals.user) {
    redirect(302, '/dashboard');
  }
};
