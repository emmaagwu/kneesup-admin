import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const email = url.searchParams.get('email') ?? '';
  return { email };
};