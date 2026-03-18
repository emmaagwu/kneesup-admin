/**
 * Firebase ADMIN SDK — server-only.
 * Never import this in client-side code or +page.svelte scripts.
 * Only use in +page.server.ts / +server.ts / hooks.server.ts.
 */
import admin from 'firebase-admin';
import { FIREBASE_SERVICE_ACCOUNT_JSON } from '$env/static/private';

// Guard against duplicate initialization (HMR / multiple imports)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
