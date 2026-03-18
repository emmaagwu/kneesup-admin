/**
 * Admin Portal — Database service (server-only).
 *
 * All functions query the SAME Firestore database as the host portal.
 * The database collections are:
 *   - user          : { email, orgId, userRole?, profile: { firstName, lastName, … } }
 *   - organization  : { name, orgMembersIds[], orgMembers[], venues[], … }
 *   - venue         : { name, orgId, address, city, state, country, spaces[], … }
 *   - reservation   : { orgId, venueId, laceyName, laceyEmail, totalCost,
 *                       reservationState, recordCreationTimeStamp, … }
 *
 * Fields that are NOT available in the current schema and therefore
 * CANNOT be integrated at the moment are marked with ⚠️.
 */

import { adminDb } from '$lib/firebase/server';
import type { AdminUser } from '$lib/types';

// ─── User / Auth ──────────────────────────────────────────────────────────────

/**
 * Look up a Firestore "user" document by Firebase UID.
 * Returns null when none exists.
 */
export async function getUserByUid(uid: string) {
  const snap = await adminDb.collection('user').doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

/**
 * Verify that the authenticated Firebase user is an Admin.
 *
 * The host portal stores `userRole: "Admin"` on the Firestore user document
 * for platform-level admins (see dborganization.server.js → getOrgsForUser).
 *
 * Returns the AdminUser shape needed by the admin portal's auth store,
 * or null if the user is not found / not an admin.
 */
export async function verifyAdminUser(
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
): Promise<AdminUser | null> {
  const userDoc = await getUserByUid(uid);

  // Only users with userRole === "Admin" in Firestore can access the portal
  if (!userDoc || userDoc['userRole'] !== 'Admin') {
    return null;
  }

  return {
    uid,
    email,
    displayName: displayName ?? email,
    photoURL: photoURL ?? undefined,
    role: (userDoc['adminRole'] as AdminUser['role']) ?? 'admin',
    createdAt: userDoc['createdAt']
      ? new Date((userDoc['createdAt'] as number) * 1000).toISOString()
      : new Date().toISOString()
  };
}

// ─── Platform Stats (Dashboard) ───────────────────────────────────────────────

export interface PlatformStats {
  totalOrganizations: number;
  totalVenues: number;
  totalReservations: number;
  /** ⚠️ totalGrossRevenue: Computed from reservation.totalCost.
   *  Note: This is a rough approximation — real revenue reconciliation
   *  requires Stripe payout data which is not stored in Firestore. */
  totalGrossRevenue: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [orgsSnap, venuesSnap, reservationsSnap] = await Promise.all([
    adminDb.collection('organization').count().get(),
    adminDb.collection('venue').count().get(),
    adminDb.collection('reservation').get()
  ]);

  // Sum totalCost across all reservations (accepted + paid)
  let totalGrossRevenue = 0;
  reservationsSnap.docs.forEach((doc) => {
    const cost = doc.data()['totalCost'];
    if (typeof cost === 'number') totalGrossRevenue += cost;
  });

  return {
    totalOrganizations: orgsSnap.data().count,
    totalVenues: venuesSnap.data().count,
    totalReservations: reservationsSnap.size,
    totalGrossRevenue
  };
}

// ─── Recent Reservations ──────────────────────────────────────────────────────

export interface AdminReservation {
  id: string;
  /** Guest name (stored as laceyName in Firestore) */
  guest: string;
  /** Guest email */
  guestEmail: string;
  /** Venue name (stored as venue field) */
  venue: string;
  /** Organization ID — used to look up org name */
  orgId: string;
  /** Organization name resolved after fetching the org */
  org: string;
  /** ISO date string of the event */
  date: string;
  /** Total cost in dollars */
  amount: number;
  /** Mapped from reservationState */
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

const STATE_TO_STATUS: Record<string, AdminReservation['status']> = {
  NEW: 'pending',
  ACCEPTED: 'confirmed',
  DECLINED: 'cancelled',
  COMPLETED: 'completed'
};

export async function getRecentReservations(limit = 10): Promise<AdminReservation[]> {
  const snap = await adminDb
    .collection('reservation')
    .orderBy('recordCreationTimeStamp', 'desc')
    .limit(limit)
    .get();

  // Batch-resolve org names
  const orgIds = [...new Set(snap.docs.map((d) => d.data()['orgId'] as string).filter(Boolean))];
  const orgNames: Record<string, string> = {};

  await Promise.all(
    orgIds.map(async (orgId) => {
      const orgSnap = await adminDb.collection('organization').doc(orgId).get();
      orgNames[orgId] = orgSnap.exists ? (orgSnap.data()?.['name'] ?? orgId) : orgId;
    })
  );

  return snap.docs.map((doc) => {
    const d = doc.data();
    const state = (d['reservationState'] as string) ?? 'NEW';
    return {
      id: doc.id,
      guest: (d['laceyName'] as string) ?? 'Unknown',
      guestEmail: (d['laceyEmail'] as string) ?? '',
      venue: (d['venue'] as string) ?? 'Unknown Venue',
      orgId: d['orgId'] as string,
      org: orgNames[d['orgId'] as string] ?? '',
      date: (d['eventDate'] as string) ?? new Date().toISOString().split('T')[0],
      amount: (d['totalCost'] as number) ?? 0,
      status: STATE_TO_STATUS[state] ?? 'pending',
      createdAt: d['recordCreationTimeStamp']
        ? new Date((d['recordCreationTimeStamp'] as number) * 1000).toISOString()
        : new Date().toISOString()
    };
  });
}

// ─── All Reservations (with search/filter) ────────────────────────────────────

export async function getAllReservations(): Promise<AdminReservation[]> {
  const snap = await adminDb
    .collection('reservation')
    .orderBy('recordCreationTimeStamp', 'desc')
    .get();

  const orgIds = [...new Set(snap.docs.map((d) => d.data()['orgId'] as string).filter(Boolean))];
  const orgNames: Record<string, string> = {};
  await Promise.all(
    orgIds.map(async (orgId) => {
      const orgSnap = await adminDb.collection('organization').doc(orgId).get();
      orgNames[orgId] = orgSnap.exists ? (orgSnap.data()?.['name'] ?? orgId) : orgId;
    })
  );

  return snap.docs.map((doc) => {
    const d = doc.data();
    const state = (d['reservationState'] as string) ?? 'NEW';
    return {
      id: doc.id,
      guest: (d['laceyName'] as string) ?? 'Unknown',
      guestEmail: (d['laceyEmail'] as string) ?? '',
      venue: (d['venue'] as string) ?? 'Unknown Venue',
      orgId: d['orgId'] as string,
      org: orgNames[d['orgId'] as string] ?? '',
      date: (d['eventDate'] as string) ?? new Date().toISOString().split('T')[0],
      amount: (d['totalCost'] as number) ?? 0,
      status: STATE_TO_STATUS[state] ?? 'pending',
      createdAt: d['recordCreationTimeStamp']
        ? new Date((d['recordCreationTimeStamp'] as number) * 1000).toISOString()
        : new Date().toISOString()
    };
  });
}

// ─── Organizations ────────────────────────────────────────────────────────────

export interface AdminOrganization {
  id: string;
  name: string;
  /** Email of the Owner member (first orgMember with userRole "Owner") */
  email: string;
  /** ⚠️ phone: Not stored in Firestore organization document */
  phone: string;
  /** logoURL stored as org.logo */
  logoURL?: string;
  venueCount: number;
  /** ⚠️ status: Not stored in Firestore — defaulting to "active". Real status
   *  tracking (suspended/pending) would require a new `status` field in Firestore */
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

export async function getAllOrganizations(): Promise<AdminOrganization[]> {
  const snap = await adminDb.collection('organization').get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const members: Array<{ userRole: string; email: string }> = d['orgMembers'] ?? [];
    const owner = members.find((m) => m.userRole === 'Owner');

    return {
      id: doc.id,
      name: (d['name'] as string) ?? 'Unnamed Organisation',
      email: owner?.email ?? '',
      phone: '', // ⚠️ Not available in current schema
      logoURL: (d['logo'] as string | undefined) ?? undefined,
      venueCount: ((d['venues'] as string[]) ?? []).length,
      status: 'active', // ⚠️ No status field in current schema
      createdAt: new Date().toISOString() // ⚠️ No createdAt on orgs in current schema
    };
  });
}

export async function getOrganizationById(id: string): Promise<AdminOrganization | null> {
  const doc = await adminDb.collection('organization').doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  const members: Array<{ userRole: string; email: string }> = d['orgMembers'] ?? [];
  const owner = members.find((m) => m.userRole === 'Owner');
  return {
    id: doc.id,
    name: (d['name'] as string) ?? 'Unnamed Organisation',
    email: owner?.email ?? '',
    phone: '',
    logoURL: (d['logo'] as string | undefined) ?? undefined,
    venueCount: ((d['venues'] as string[]) ?? []).length,
    status: 'active',
    createdAt: new Date().toISOString()
  };
}

/** Top organizations by number of reservations */
export async function getTopOrganizations(topN = 5) {
  const [orgsSnap, reservationsSnap] = await Promise.all([
    adminDb.collection('organization').get(),
    adminDb.collection('reservation').get()
  ]);

  // Count reservations per org and sum revenue
  const orgStats: Record<string, { revenue: number; reservations: number }> = {};
  reservationsSnap.docs.forEach((doc) => {
    const orgId = doc.data()['orgId'] as string;
    if (!orgStats[orgId]) orgStats[orgId] = { revenue: 0, reservations: 0 };
    orgStats[orgId].revenue += (doc.data()['totalCost'] as number) ?? 0;
    orgStats[orgId].reservations += 1;
  });

  return orgsSnap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: (d['name'] as string) ?? 'Unnamed',
        venues: ((d['venues'] as string[]) ?? []).length,
        revenue: orgStats[doc.id]?.revenue ?? 0,
        status: 'active'
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topN);
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export interface AdminVenue {
  id: string;
  name: string;
  orgId: string;
  orgName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  spacesCount: number;
  /** ⚠️ status: Not stored in Firestore — defaulting to "active" */
  status: 'active' | 'inactive' | 'blocked';
  /** ⚠️ rating: Not stored in Firestore venue document at all */
  rating: number;
}

export async function getAllVenues(): Promise<AdminVenue[]> {
  const [venuesSnap, orgsSnap] = await Promise.all([
    adminDb.collection('venue').get(),
    adminDb.collection('organization').get()
  ]);

  const orgNames: Record<string, string> = {};
  orgsSnap.docs.forEach((doc) => {
    orgNames[doc.id] = (doc.data()['name'] as string) ?? doc.id;
  });

  return venuesSnap.docs.map((doc) => {
    const d = doc.data();
    const addressParts = [d['address'], d['city'], d['state']].filter(Boolean);
    return {
      id: doc.id,
      name: (d['name'] as string) ?? 'Unnamed Venue',
      orgId: (d['orgId'] as string) ?? '',
      orgName: orgNames[(d['orgId'] as string) ?? ''] ?? 'Unknown Org',
      address: addressParts.join(', '),
      city: (d['city'] as string) ?? '',
      state: (d['state'] as string) ?? '',
      country: (d['country'] as string) ?? '',
      spacesCount: ((d['spaces'] as unknown[]) ?? []).length,
      status: 'active', // ⚠️ No status field in current schema
      rating: 0 // ⚠️ No rating field in current schema
    };
  });
}

// ─── Revenue Records ──────────────────────────────────────────────────────────

export interface AdminRevenueRecord {
  id: string;
  org: string;
  venue: string;
  /** Gross amount paid by guest */
  amount: number;
  /** Platform fee — ⚠️ No fee field in Firestore; computed as 10% of gross */
  fee: number;
  net: number;
  date: string;
  reservationId: string;
}

/** Platform fee percentage — update if/when this changes */
const PLATFORM_FEE_PCT = 0.1;

export async function getRevenueRecords(): Promise<AdminRevenueRecord[]> {
  const snap = await adminDb
    .collection('reservation')
    .where('reservationState', 'in', ['ACCEPTED', 'COMPLETED'])
    .orderBy('recordCreationTimeStamp', 'desc')
    .get();

  const orgIds = [...new Set(snap.docs.map((d) => d.data()['orgId'] as string).filter(Boolean))];
  const orgNames: Record<string, string> = {};
  await Promise.all(
    orgIds.map(async (orgId) => {
      const orgSnap = await adminDb.collection('organization').doc(orgId).get();
      orgNames[orgId] = orgSnap.exists ? (orgSnap.data()?.['name'] ?? orgId) : orgId;
    })
  );

  return snap.docs.map((doc) => {
    const d = doc.data();
    const gross = (d['totalCost'] as number) ?? 0;
    const fee = Math.round(gross * PLATFORM_FEE_PCT * 100) / 100;
    return {
      id: doc.id,
      org: orgNames[(d['orgId'] as string) ?? ''] ?? '',
      venue: (d['venue'] as string) ?? 'Unknown Venue',
      amount: gross,
      fee,
      net: gross - fee,
      date: d['recordCreationTimeStamp']
        ? new Date((d['recordCreationTimeStamp'] as number) * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      reservationId: doc.id
    };
  });
}

// ─── Admin Team ───────────────────────────────────────────────────────────────

/**
 * ⚠️ Admin Team: The current Firestore schema has no dedicated "admin" collection.
 * We query users with `userRole === "Admin"` instead.
 * Fields like `lastActive`, `adminRole`, and `status` are not stored and will
 * default to placeholder values until you add those fields to Firestore.
 */
export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  photoURL?: string;
  /** ⚠️ lastActive: Not stored in Firestore */
  lastActive: string;
  /** ⚠️ status: Not stored in Firestore */
  status: 'active' | 'inactive';
  createdAt: string;
}

export async function getAdminTeam(): Promise<AdminMember[]> {
  const snap = await adminDb.collection('user').where('userRole', '==', 'Admin').get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const profile = (d['profile'] as Record<string, string | null>) ?? {};
    const firstName = profile['firstName'] ?? '';
    const lastName = profile['lastName'] ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || (d['email'] as string);
    return {
      id: doc.id,
      name: displayName,
      email: (d['email'] as string) ?? '',
      role: (d['adminRole'] as AdminMember['role']) ?? 'admin',
      photoURL: (d['photoURL'] as string | undefined) ?? undefined,
      lastActive: new Date().toISOString(), // ⚠️ Not stored
      status: 'active', // ⚠️ Not stored
      createdAt: d['createdAt']
        ? new Date((d['createdAt'] as number)).toISOString()
        : new Date().toISOString()
    };
  });
}
