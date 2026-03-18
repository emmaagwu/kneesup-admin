import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Gate: only admins can access any dashboard route
  if (!locals.user) {
    redirect(302, '/login');
  }

  return {
    user: locals.user
  };
};
