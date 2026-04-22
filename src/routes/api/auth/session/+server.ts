/**
 * POST /api/auth/session
 *
 * Accepts a Firebase ID token from the client, verifies it,
 * checks that the user has userRole in ["Admin", "Developer"] in Firestore,
 * and sets an HttpOnly session cookie.
 *
 * Body: { idToken: string }
 * Response 200: { user: AdminUser }
 * Response 401: { error: string }
 * Response 403: { error: string }  — authenticated but lacks dashboard role
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '$lib/server/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
  let idToken: string;

  try {
    const body = await request.json() as { idToken?: string };
    if (!body.idToken || typeof body.idToken !== 'string') {
      return json({ error: 'idToken is required' }, { status: 400 });
    }
    idToken = body.idToken;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await createAdminSession(idToken);

    if (!result) {
      return json(
        { error: 'Access denied. This account does not have dashboard privileges.' },
        { status: 403 }
      );
    }

    // Set the session cookie — HttpOnly so JS can't read it
    cookies.set(SESSION_COOKIE_NAME, result.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/'
    });

    return json({ user: result.user });
  } catch (err: unknown) {
    console.error('[/api/auth/session] Error:', err);
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return json({ error: message }, { status: 401 });
  }
};

/**
 * DELETE /api/auth/session
 * Clears the session cookie (logout).
 */
export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return json({ ok: true });
};
