/**
 * SvelteKit server hooks.
 *
 * On every request:
 *  1. Read the session cookie.
 *  2. Verify it against Firebase Admin Auth.
 *  3. Confirm the user has userRole === "Admin" in Firestore.
 *  4. Attach the AdminUser (or null) to event.locals.
 */

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, verifyAdminSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get(SESSION_COOKIE_NAME);

  if (sessionCookie) {
    const user = await verifyAdminSession(sessionCookie);
    event.locals.user = user;
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
