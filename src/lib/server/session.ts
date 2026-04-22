/**
 * Session helpers — server-only.
 *
 * Strategy:
 *  • Client signs in via Firebase Auth (Google or email/password).
 *  • Client POSTs the Firebase ID token to /api/auth/session.
 *  • Server verifies the token, checks Firestore for userRole in ["Admin", "Developer"],
 *    mints a Firebase session cookie (1-day), and sets it as HttpOnly.
 *  • On every protected request, hooks.server.ts verifies the cookie.
 */

import { adminAuth, adminDb } from '$lib/firebase/server';
import type { AdminUser } from '$lib/types';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Exchange a Firebase ID token for a session cookie string.
 * Returns null if the user is not allowed into the admin dashboard.
 */
export async function createAdminSession(idToken: string): Promise<{
  cookie: string;
  user: AdminUser;
} | null> {
  // 1. Verify the raw ID token
  const decoded = await adminAuth.verifyIdToken(idToken, true);

  // 2. Check Firestore for dashboard role
  const userDoc = await adminDb.collection('user').doc(decoded.uid).get();
  const userRole = userDoc.data()?.['userRole'];
  if (!userDoc.exists || (userRole !== 'Admin' && userRole !== 'Developer')) {
    return null;
  }

  // 3. Mint a session cookie (Firebase handles expiry validation automatically)
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS
  });

  const d = userDoc.data()!;
  const profile = (d['profile'] as Record<string, string | null>) ?? {};
  const displayName =
    decoded.name ??
    [profile['firstName'], profile['lastName']].filter(Boolean).join(' ') ??
    decoded.email ??
    '';

  const resolvedRole: AdminUser['role'] =
    userRole === 'Developer'
      ? 'developer'
      : ((d['adminRole'] as AdminUser['role']) ?? 'admin');

  const user: AdminUser = {
    uid: decoded.uid,
    email: decoded.email ?? '',
    displayName,
    photoURL: decoded.picture ?? undefined,
    role: resolvedRole,
    createdAt: d['createdAt']
      ? new Date((d['createdAt'] as number)).toISOString()
      : new Date().toISOString()
  };

  return { cookie: sessionCookie, user };
}

/**
 * Verify the session cookie from the request and return the AdminUser.
 * Returns null if the cookie is missing, expired, or the user lacks dashboard role.
 */
export async function verifyAdminSession(sessionCookie: string): Promise<AdminUser | null> {
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const userDoc = await adminDb.collection('user').doc(decoded.uid).get();
    const userRole = userDoc.data()?.['userRole'];
    if (!userDoc.exists || (userRole !== 'Admin' && userRole !== 'Developer')) {
      return null;
    }

    const d = userDoc.data()!;
    const profile = (d['profile'] as Record<string, string | null>) ?? {};
    const displayName =
      decoded.name ??
      [profile['firstName'], profile['lastName']].filter(Boolean).join(' ') ??
      decoded.email ??
      '';

    const resolvedRole: AdminUser['role'] =
      userRole === 'Developer'
        ? 'developer'
        : ((d['adminRole'] as AdminUser['role']) ?? 'admin');

    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName,
      photoURL: decoded.picture ?? undefined,
      role: resolvedRole,
      createdAt: d['createdAt']
        ? new Date((d['createdAt'] as number)).toISOString()
        : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
