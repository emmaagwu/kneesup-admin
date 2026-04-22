/**
 * Firebase ADMIN SDK — server-only.
 * Never import this in client-side code or +page.svelte scripts.
 * Only use in +page.server.ts / +server.ts / hooks.server.ts.
 */
import admin from 'firebase-admin';
import { FIREBASE_SERVICE_ACCOUNT_JSON } from '$env/static/private';
import { PUBLIC_FIREBASE_STORAGE_BUCKET } from '$env/static/public';
import { Storage } from '@google-cloud/storage';

// Parse service account
const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);

// Guard against duplicate initialization (HMR / multiple imports)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Google Cloud Storage initialization
export const gcsStorage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key
  }
});

// Export bucket name for use in forms
export const storageBucket = PUBLIC_FIREBASE_STORAGE_BUCKET;

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
