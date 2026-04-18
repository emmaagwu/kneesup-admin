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
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminUser } from '$lib/types';

const WRITE_BATCH_SIZE = 400;

async function commitDeleteByRefs(refs: FirebaseFirestore.DocumentReference[]) {
  for (let i = 0; i < refs.length; i += WRITE_BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const ref of refs.slice(i, i + WRITE_BATCH_SIZE)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

function uniqueNonEmpty(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function normalizeProtectedIds(protectedUserIds?: string | string[]) {
  if (!protectedUserIds) return [] as string[];
  if (Array.isArray(protectedUserIds)) return uniqueNonEmpty(protectedUserIds);
  return uniqueNonEmpty([protectedUserIds]);
}

function isFirestoreMissingIndexError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message =
    'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return code === '9' || code === 'failed-precondition' || message.includes('FAILED_PRECONDITION');
}

export async function resolveUserIdsByEmails(emails: string[]) {
  const normalizedEmails = uniqueNonEmpty(emails.map((email) => email.trim().toLowerCase()));
  if (normalizedEmails.length === 0) return [] as string[];

  const ids = new Set<string>();
  for (const group of chunk(normalizedEmails, 10)) {
    const snap = await adminDb.collection('user').where('email', 'in', group).get();
    for (const doc of snap.docs) ids.add(doc.id);
  }
  return Array.from(ids);
}

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
 * Verify that the authenticated Firebase user can access dashboard features.
 *
 * The host portal stores `userRole` on the Firestore user document.
 * This admin dashboard allows `Admin` and `Developer`.
 *
 * Returns the AdminUser shape needed by the admin portal's auth store,
 * or null if the user is not found / not allowed.
 */
export async function verifyAdminUser(
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
): Promise<AdminUser | null> {
  const userDoc = await getUserByUid(uid);

  // Only users with userRole in ["Admin", "Developer"] can access the portal
  const userRole = userDoc?.['userRole'];
  if (!userDoc || (userRole !== 'Admin' && userRole !== 'Developer')) {
    return null;
  }

  const resolvedRole: AdminUser['role'] =
    userRole === 'Developer'
      ? 'developer'
      : ((userDoc['adminRole'] as AdminUser['role']) ?? 'admin');

  return {
    uid,
    email,
    displayName: displayName ?? email,
    photoURL: photoURL ?? undefined,
    role: resolvedRole,
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

export interface CreateOrganizationInput {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerTitle?: string;
  phone?: string;
  logoURL?: string;
}

export async function createOrganization(input: CreateOrganizationInput): Promise<string> {
  const name = input.name.trim();
  const ownerName = input.ownerName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerTitle = input.ownerTitle?.trim() || 'Owner';
  const phone = input.phone?.trim() || '';
  const logoURL = input.logoURL?.trim() || '';
  const ownerUserId = globalThis.crypto.randomUUID();

  const docRef = await adminDb.collection('organization').add({
    name,
    email: ownerEmail,
    ownerName,
    ownerEmail,
    ownerTitle,
    phone,
    logo: logoURL,
    logoURL,
    orgMembersIds: [ownerUserId],
    orgMembers: [
      {
        userId: ownerUserId,
        userRole: ownerTitle,
        email: ownerEmail,
        name: ownerName
      }
    ],
    venues: [],
    status: 'active'
  });

  return docRef.id;
}

export interface CreateVenueInput {
  name: string;
  description?: string;
  orgId: string;
  country: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phoneNumber?: string;
  email?: string;
  photoURL?: string;
}

export async function createVenue(input: CreateVenueInput): Promise<string> {
  const name = input.name.trim();
  const orgId = input.orgId.trim();
  const description = input.description?.trim() || '';
  const country = input.country.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const zip = input.zip.trim();
  const phoneNumber = input.phoneNumber?.trim() || '';
  const email = input.email?.trim().toLowerCase() || '';
  const photoURL = input.photoURL?.trim() || '';

  const venueRef = adminDb.collection('venue').doc();
  await venueRef.set({
    name,
    description,
    orgId,
    country,
    address,
    city,
    state,
    zip,
    phoneNumber,
    email,
    photo: photoURL,
    photos: photoURL ? [{ src: photoURL }] : [],
    gallery: photoURL ? [photoURL] : [],
    spaces: [],
    hours: {},
    status: 'active',
    recordCreationTimeStamp: Math.floor(Date.now() / 1000)
  });

  if (orgId) {
    await adminDb.collection('organization').doc(orgId).set(
      {
        venues: FieldValue.arrayUnion(venueRef.id)
      },
      { merge: true }
    );
  }

  return venueRef.id;
}

export interface OrganizationCascadeDeleteResult {
  orgId: string;
  deletedOrganization: boolean;
  deletedVenues: number;
  deletedReservations: number;
  deletedGuests: number;
  detachedUsers: number;
}

export interface OrganizationCascadePreviewResult {
  orgId: string;
  organizationExists: boolean;
  venues: number;
  reservations: number;
  guests: number;
  usersToDetach: number;
}

async function collectOrganizationCascadeTargets(orgId: string) {
  const organizationRef = adminDb.collection('organization').doc(orgId);
  const organizationSnap = await organizationRef.get();
  if (!organizationSnap.exists) {
    return {
      organizationRef,
      organizationExists: false,
      venuesSnap: null,
      reservationsSnap: null,
      usersSnap: null,
      guestRefsMap: new Map<string, FirebaseFirestore.DocumentReference>()
    };
  }

  const [venuesSnap, reservationsSnap, usersSnap, guestsByOrgSnap] = await Promise.all([
    adminDb.collection('venue').where('orgId', '==', orgId).get(),
    adminDb.collection('reservation').where('orgId', '==', orgId).get(),
    adminDb.collection('user').where('orgId', '==', orgId).get(),
    adminDb.collection('guests').where('orgId', '==', orgId).get()
  ]);

  const venueIds = uniqueNonEmpty(venuesSnap.docs.map((doc) => doc.id));
  const reservationIds = uniqueNonEmpty(reservationsSnap.docs.map((doc) => doc.id));

  const guestRefsMap = new Map<string, FirebaseFirestore.DocumentReference>();
  for (const doc of guestsByOrgSnap.docs) {
    guestRefsMap.set(doc.id, doc.ref);
  }

  for (const ids of chunk(venueIds, 10)) {
    const guestsSnap = await adminDb.collection('guests').where('venueId', 'in', ids).get();
    for (const doc of guestsSnap.docs) guestRefsMap.set(doc.id, doc.ref);
  }

  for (const ids of chunk(reservationIds, 10)) {
    const guestsSnap = await adminDb.collection('guests').where('reservationId', 'in', ids).get();
    for (const doc of guestsSnap.docs) guestRefsMap.set(doc.id, doc.ref);
  }

  return {
    organizationRef,
    organizationExists: true,
    venuesSnap,
    reservationsSnap,
    usersSnap,
    guestRefsMap
  };
}

export async function previewDeleteOrganizationCascade(orgId: string): Promise<OrganizationCascadePreviewResult> {
  const targets = await collectOrganizationCascadeTargets(orgId);
  if (!targets.organizationExists || !targets.venuesSnap || !targets.reservationsSnap || !targets.usersSnap) {
    return {
      orgId,
      organizationExists: false,
      venues: 0,
      reservations: 0,
      guests: 0,
      usersToDetach: 0
    };
  }

  return {
    orgId,
    organizationExists: true,
    venues: targets.venuesSnap.size,
    reservations: targets.reservationsSnap.size,
    guests: targets.guestRefsMap.size,
    usersToDetach: targets.usersSnap.size
  };
}

export async function previewDeleteOrganizationsCascade(orgIds: string[]) {
  const targetIds = uniqueNonEmpty(orgIds);
  const results: OrganizationCascadePreviewResult[] = [];
  for (const orgId of targetIds) {
    results.push(await previewDeleteOrganizationCascade(orgId));
  }
  return results;
}

export async function deleteOrganizationCascade(orgId: string): Promise<OrganizationCascadeDeleteResult> {
  const targets = await collectOrganizationCascadeTargets(orgId);
  if (
    !targets.organizationExists ||
    !targets.venuesSnap ||
    !targets.reservationsSnap ||
    !targets.usersSnap
  ) {
    return {
      orgId,
      deletedOrganization: false,
      deletedVenues: 0,
      deletedReservations: 0,
      deletedGuests: 0,
      detachedUsers: 0
    };
  }

  for (let i = 0; i < targets.usersSnap.docs.length; i += WRITE_BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const userDoc of targets.usersSnap.docs.slice(i, i + WRITE_BATCH_SIZE)) {
      batch.update(userDoc.ref, { orgId: FieldValue.delete() });
    }
    await batch.commit();
  }

  await commitDeleteByRefs(Array.from(targets.guestRefsMap.values()));
  await commitDeleteByRefs(targets.reservationsSnap.docs.map((doc) => doc.ref));
  await commitDeleteByRefs(targets.venuesSnap.docs.map((doc) => doc.ref));
  await targets.organizationRef.delete();

  return {
    orgId,
    deletedOrganization: true,
    deletedVenues: targets.venuesSnap.size,
    deletedReservations: targets.reservationsSnap.size,
    deletedGuests: targets.guestRefsMap.size,
    detachedUsers: targets.usersSnap.size
  };
}

export async function deleteOrganizationsCascade(orgIds: string[]) {
  const targetIds = uniqueNonEmpty(orgIds);
  const results: OrganizationCascadeDeleteResult[] = [];
  for (const orgId of targetIds) {
    results.push(await deleteOrganizationCascade(orgId));
  }
  return results;
}

export interface DeleteUserResult {
  userId: string;
  deletedUser: boolean;
  detachedFromOrganizations: number;
}

export interface DeleteUserPreviewResult {
  userId: string;
  userExists: boolean;
  organizationsToDetach: number;
}

export async function previewDeleteUserAccount(userId: string): Promise<DeleteUserPreviewResult> {
  const userRef = adminDb.collection('user').doc(userId);
  const [userSnap, orgsSnap] = await Promise.all([
    userRef.get(),
    adminDb.collection('organization').where('orgMembersIds', 'array-contains', userId).get()
  ]);

  return {
    userId,
    userExists: userSnap.exists,
    organizationsToDetach: orgsSnap.size
  };
}

export async function previewDeleteUserAccounts(userIds: string[], protectedUserIds?: string | string[]) {
  const protectedIdsSet = new Set(normalizeProtectedIds(protectedUserIds));
  const uniqueInputIds = uniqueNonEmpty(userIds);
  const targetIds = uniqueInputIds.filter((id) => !protectedIdsSet.has(id));
  const skippedProtected = uniqueInputIds.filter((id) => protectedIdsSet.has(id)).length;

  const results: DeleteUserPreviewResult[] = [];
  for (const userId of targetIds) {
    results.push(await previewDeleteUserAccount(userId));
  }

  return { results, skippedProtected };
}

export async function deleteUserAccount(userId: string): Promise<DeleteUserResult> {
  const userRef = adminDb.collection('user').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return { userId, deletedUser: false, detachedFromOrganizations: 0 };
  }

  const orgsSnap = await adminDb.collection('organization').where('orgMembersIds', 'array-contains', userId).get();
  for (const orgDoc of orgsSnap.docs) {
    const data = orgDoc.data();
    const orgMembersIds = ((data['orgMembersIds'] as string[]) ?? []).filter((id) => id !== userId);
    const orgMembers = ((data['orgMembers'] as Array<Record<string, unknown>>) ?? []).filter(
      (member) => String(member.userId ?? '') !== userId
    );

    await orgDoc.ref.update({ orgMembersIds, orgMembers });
  }

  await userRef.delete();
  return { userId, deletedUser: true, detachedFromOrganizations: orgsSnap.size };
}

export async function deleteUserAccounts(userIds: string[], protectedUserIds?: string | string[]) {
  const protectedIdsSet = new Set(normalizeProtectedIds(protectedUserIds));
  const uniqueInputIds = uniqueNonEmpty(userIds);
  const targetIds = uniqueInputIds.filter((id) => !protectedIdsSet.has(id));
  const skippedProtected = uniqueInputIds.filter((id) => protectedIdsSet.has(id)).length;

  const results: DeleteUserResult[] = [];
  for (const userId of targetIds) {
    results.push(await deleteUserAccount(userId));
  }

  return { results, skippedProtected };
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
      email: owner?.email ?? (d['email'] as string) ?? '',
      phone: '', // ⚠️ Not available in current schema
      logoURL: (d['logo'] as string | undefined) ?? (d['logoURL'] as string | undefined) ?? undefined,
      venueCount: ((d['venues'] as string[]) ?? []).length,
      status: (d['status'] as AdminOrganization['status']) ?? 'active',
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
    email: owner?.email ?? (d['email'] as string) ?? '',
    phone: '',
    logoURL: (d['logo'] as string | undefined) ?? (d['logoURL'] as string | undefined) ?? undefined,
    venueCount: ((d['venues'] as string[]) ?? []).length,
    status: (d['status'] as AdminOrganization['status']) ?? 'active',
    createdAt: new Date().toISOString()
  };
}

export interface UpdateOrganizationInput {
  name: string;
  ownerUserId?: string;
  ownerName: string;
  ownerEmail: string;
  ownerTitle?: string;
}

export async function updateOrganizationById(id: string, input: UpdateOrganizationInput): Promise<void> {
  const orgRef = adminDb.collection('organization').doc(id);
  const orgSnap = await orgRef.get();

  if (!orgSnap.exists) {
    throw new Error('Organization not found');
  }

  const orgData = orgSnap.data() as Record<string, unknown>;
  const members = Array.isArray(orgData['orgMembers']) ? [...(orgData['orgMembers'] as Array<Record<string, unknown>>)] : [];
  const resolvedOwnerUserId = input.ownerUserId?.trim() || String(members.find((member) => String(member.userRole ?? '').toLowerCase() === 'owner')?.userId ?? '');
  const ownerMember = {
    userId: resolvedOwnerUserId || globalThis.crypto.randomUUID(),
    userRole: input.ownerTitle?.trim() || 'Owner',
    email: input.ownerEmail.trim().toLowerCase(),
    name: input.ownerName.trim()
  };

  const ownerIndex = members.findIndex((member) => String(member.userId ?? '') === ownerMember.userId);
  if (ownerIndex >= 0) {
    members[ownerIndex] = ownerMember;
  } else {
    members.unshift(ownerMember);
  }

  const orgMemberIds = uniqueNonEmpty([
    ...(Array.isArray(orgData['orgMembersIds']) ? (orgData['orgMembersIds'] as string[]) : []),
    ownerMember.userId
  ]);

  await orgRef.update({
    name: input.name.trim(),
    email: input.ownerEmail.trim().toLowerCase(),
    ownerName: input.ownerName.trim(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    ownerTitle: input.ownerTitle?.trim() || 'Owner',
    orgMembersIds: orgMemberIds,
    orgMembers: members
  });

  if (ownerMember.userId) {
    await adminDb.collection('user').doc(ownerMember.userId).set(
      {
        email: input.ownerEmail.trim().toLowerCase(),
        profile: {
          firstName: input.ownerName.trim().split(' ')[0] ?? '',
          lastName: input.ownerName.trim().split(' ').slice(1).join(' ')
        }
      },
      { merge: true }
    );
  }
}

export interface VenueSpaceRow {
  id: string;
  name: string;
  description: string;
  maxGuest: number;
  status: 'active' | 'inactive';
}

export interface VenueReservationRow {
  id: string;
  client: string;
  email: string;
  venue: string;
  space: string;
  cost: string;
  dateTime: string;
  duration: string;
  status: 'active' | 'inactive';
}

type VenueDayHours = { enabled: boolean; slots: { from: string; to: string }[] };

const DEFAULT_VENUE_HOURS: Record<string, VenueDayHours> = {
  Monday: { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  Tuesday: { enabled: true, slots: [{ from: '6:00 AM', to: '8:00 AM' }, { from: '10:00 AM', to: '6:00 PM' }] },
  Wednesday: { enabled: true, slots: [{ from: '10:00 AM', to: '6:00 PM' }] },
  Thursday: { enabled: false, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  Friday: { enabled: true, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  Saturday: { enabled: true, slots: [{ from: '6:00 AM', to: '8:00 AM' }] },
  Sunday: { enabled: true, slots: [{ from: '6:00 AM', to: '8:00 AM' }] }
};

const DEFAULT_VENUE_GALLERY = [
  '/images/venue-image1.png',
  '/images/venue-image2.png',
  '/images/venue-image3.png',
  '/images/venue-image4.png',
  '/images/venue-image5.png',
  '/images/venue-image6.png',
  '/images/venue-image7.png',
  '/images/venue-image8.png'
];

function toVenueHours(value: unknown): Record<string, VenueDayHours> {
  if (!value || typeof value !== 'object') return DEFAULT_VENUE_HOURS;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(DEFAULT_VENUE_HOURS).map(([day, fallback]) => {
      const dayValue = source[day] as Record<string, unknown> | undefined;
      const slots = Array.isArray(dayValue?.slots)
        ? (dayValue?.slots as Array<{ from?: string; to?: string }>).map((slot) => ({
            from: slot.from ?? '6:00 AM',
            to: slot.to ?? '8:00 AM'
          }))
        : fallback.slots;
      return [
        day,
        {
          enabled: typeof dayValue?.enabled === 'boolean' ? dayValue.enabled : fallback.enabled,
          slots: slots.length > 0 ? slots : fallback.slots
        }
      ];
    })
  );
}

function formatVenueMoney(amount: number) {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export async function getVenueById(id: string): Promise<{
  id: string;
  name: string;
  organization: string;
  address: string;
  description: string;
  status: 'active' | 'inactive' | 'blocked';
  spaceCount: number;
  reservationCount: number;
  revenue: string;
  spaces: VenueSpaceRow[];
  reservations: VenueReservationRow[];
  hours: Record<string, VenueDayHours>;
  gallery: string[];
} | null> {
  const [venueSnap, reservationsSnap] = await Promise.all([
    adminDb.collection('venue').doc(id).get(),
    adminDb.collection('reservation').where('venueId', '==', id).get()
  ]);

  if (!venueSnap.exists) return null;

  const venueData = venueSnap.data() as Record<string, unknown>;
  const orgId = String(venueData['orgId'] ?? '');
  const orgSnap = orgId ? await adminDb.collection('organization').doc(orgId).get() : null;
  const organizationName = orgSnap?.exists
    ? String(orgSnap.data()?.['name'] ?? (orgId || 'Unknown Org'))
    : (orgId || 'Unknown Org');

  const rawSpaces = Array.isArray(venueData['spaces']) ? (venueData['spaces'] as Array<Record<string, unknown>>) : [];
  const spaces = rawSpaces.map((space, index) => {
    const blurbs = Array.isArray(space['blurbs']) ? (space['blurbs'] as string[]) : [];
    return {
      id: String(space['id'] ?? `space-${index + 1}`),
      name: String(space['name'] ?? 'Unnamed Space'),
      description: blurbs[0] ?? String(space['description'] ?? 'No description available.'),
      maxGuest: Number(space['maxGuests'] ?? space['capacity'] ?? 0),
      status: 'active' as const
    };
  });

  const reservations = reservationsSnap.docs
    .map((doc) => {
      const data = doc.data();
      const amount = (data['totalCost'] as number) ?? 0;
      const createdAt = data['recordCreationTimeStamp']
        ? new Date((data['recordCreationTimeStamp'] as number) * 1000)
        : new Date();

      const state = String(data['reservationState'] ?? 'NEW');
      const status: 'active' | 'inactive' = ['DECLINED', 'CANCELLED'].includes(state) ? 'inactive' : 'active';

      return {
        id: doc.id,
        client: String(data['laceyName'] ?? '—'),
        email: String(data['laceyEmail'] ?? '—'),
        venue: String(data['venue'] ?? '—'),
        space: String(data['space'] ?? data['venueSpaceName'] ?? '—'),
        cost: formatVenueMoney(amount),
        dateTime: formatDateTime(createdAt.toISOString()),
        duration: String(data['duration'] ?? '—'),
        createdAt: createdAt.getTime(),
        status
      };
    })
    .sort((left, right) => right.createdAt - left.createdAt)
    .map(({ createdAt: _createdAt, ...reservation }) => reservation);

  const grossRevenue = reservationsSnap.docs.reduce((sum, doc) => sum + ((doc.data()['totalCost'] as number) ?? 0), 0);
  const gallery = Array.isArray(venueData['gallery'])
    ? (venueData['gallery'] as string[]).filter(Boolean)
    : Array.isArray(venueData['photos'])
      ? (venueData['photos'] as Array<{ src?: string }>).map((photo) => photo.src ?? '').filter(Boolean)
      : [];

  const addressParts = [venueData['address'], venueData['city'], venueData['state'], venueData['zip']].filter(Boolean);

  return {
    id: venueSnap.id,
    name: String(venueData['name'] ?? 'Unnamed Venue'),
    organization: organizationName,
    address: addressParts.join(', '),
    description: String(venueData['description'] ?? 'No description available.'),
    status: (venueData['status'] as 'active' | 'inactive' | 'blocked') ?? 'active',
    spaceCount: spaces.length,
    reservationCount: reservations.length,
    revenue: formatVenueMoney(grossRevenue),
    spaces,
    reservations,
    hours: toVenueHours(venueData['hours'] ?? venueData['operatingHours']),
    gallery: gallery.length > 0 ? gallery : DEFAULT_VENUE_GALLERY
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

export interface VenueCascadePreviewResult {
  venueId: string;
  venueExists: boolean;
  reservations: number;
  guests: number;
  detachedFromOrganization: number;
}

export interface VenueCascadeDeleteResult {
  venueId: string;
  deletedVenue: boolean;
  deletedReservations: number;
  deletedGuests: number;
  detachedFromOrganization: number;
}

async function collectVenueCascadeTargets(venueId: string) {
  const venueRef = adminDb.collection('venue').doc(venueId);
  const venueSnap = await venueRef.get();
  if (!venueSnap.exists) {
    return {
      venueRef,
      venueExists: false,
      venueData: null,
      reservationsSnap: null,
      guestRefsMap: new Map<string, FirebaseFirestore.DocumentReference>()
    };
  }

  const venueData = venueSnap.data() as Record<string, unknown>;
  const reservationsSnap = await adminDb.collection('reservation').where('venueId', '==', venueId).get();
  const reservationIds = uniqueNonEmpty(reservationsSnap.docs.map((doc) => doc.id));

  const guestRefsMap = new Map<string, FirebaseFirestore.DocumentReference>();
  const guestsByVenueSnap = await adminDb.collection('guests').where('venueId', '==', venueId).get();
  for (const doc of guestsByVenueSnap.docs) guestRefsMap.set(doc.id, doc.ref);

  for (const ids of chunk(reservationIds, 10)) {
    const guestsSnap = await adminDb.collection('guests').where('reservationId', 'in', ids).get();
    for (const doc of guestsSnap.docs) guestRefsMap.set(doc.id, doc.ref);
  }

  return {
    venueRef,
    venueExists: true,
    venueData,
    reservationsSnap,
    guestRefsMap
  };
}

export async function previewDeleteVenueCascade(venueId: string): Promise<VenueCascadePreviewResult> {
  const targets = await collectVenueCascadeTargets(venueId);
  if (!targets.venueExists || !targets.reservationsSnap || !targets.venueData) {
    return {
      venueId,
      venueExists: false,
      reservations: 0,
      guests: 0,
      detachedFromOrganization: 0
    };
  }

  const orgId = String(targets.venueData.orgId ?? '');
  const detachedFromOrganization = orgId ? 1 : 0;

  return {
    venueId,
    venueExists: true,
    reservations: targets.reservationsSnap.size,
    guests: targets.guestRefsMap.size,
    detachedFromOrganization
  };
}

export async function previewDeleteVenuesCascade(venueIds: string[]) {
  const targetIds = uniqueNonEmpty(venueIds);
  const results: VenueCascadePreviewResult[] = [];
  for (const venueId of targetIds) {
    results.push(await previewDeleteVenueCascade(venueId));
  }
  return results;
}

export async function deleteVenueCascade(venueId: string): Promise<VenueCascadeDeleteResult> {
  const targets = await collectVenueCascadeTargets(venueId);
  if (!targets.venueExists || !targets.reservationsSnap || !targets.venueData) {
    return {
      venueId,
      deletedVenue: false,
      deletedReservations: 0,
      deletedGuests: 0,
      detachedFromOrganization: 0
    };
  }

  const orgId = String(targets.venueData.orgId ?? '');
  let detachedFromOrganization = 0;
  if (orgId) {
    const orgRef = adminDb.collection('organization').doc(orgId);
    const orgSnap = await orgRef.get();
    if (orgSnap.exists) {
      await orgRef.update({
        venues: FieldValue.arrayRemove(venueId)
      });
      detachedFromOrganization = 1;
    }
  }

  await commitDeleteByRefs(Array.from(targets.guestRefsMap.values()));
  await commitDeleteByRefs(targets.reservationsSnap.docs.map((doc) => doc.ref));
  await targets.venueRef.delete();

  return {
    venueId,
    deletedVenue: true,
    deletedReservations: targets.reservationsSnap.size,
    deletedGuests: targets.guestRefsMap.size,
    detachedFromOrganization
  };
}

export async function deleteVenuesCascade(venueIds: string[]) {
  const targetIds = uniqueNonEmpty(venueIds);
  const results: VenueCascadeDeleteResult[] = [];
  for (const venueId of targetIds) {
    results.push(await deleteVenueCascade(venueId));
  }
  return results;
}

export interface ReservationCascadePreviewResult {
  reservationId: string;
  reservationExists: boolean;
  guests: number;
}

export interface ReservationCascadeDeleteResult {
  reservationId: string;
  deletedReservation: boolean;
  deletedGuests: number;
}

async function collectReservationCascadeTargets(reservationId: string) {
  const reservationRef = adminDb.collection('reservation').doc(reservationId);
  const [reservationSnap, guestsSnap] = await Promise.all([
    reservationRef.get(),
    adminDb.collection('guests').where('reservationId', '==', reservationId).get()
  ]);

  return {
    reservationRef,
    reservationExists: reservationSnap.exists,
    guestRefs: guestsSnap.docs.map((doc) => doc.ref)
  };
}

export async function previewDeleteReservationCascade(reservationId: string): Promise<ReservationCascadePreviewResult> {
  const targets = await collectReservationCascadeTargets(reservationId);
  return {
    reservationId,
    reservationExists: targets.reservationExists,
    guests: targets.guestRefs.length
  };
}

export async function previewDeleteReservationsCascade(reservationIds: string[]) {
  const targetIds = uniqueNonEmpty(reservationIds);
  const results: ReservationCascadePreviewResult[] = [];
  for (const reservationId of targetIds) {
    results.push(await previewDeleteReservationCascade(reservationId));
  }
  return results;
}

export async function deleteReservationCascade(reservationId: string): Promise<ReservationCascadeDeleteResult> {
  const targets = await collectReservationCascadeTargets(reservationId);
  if (!targets.reservationExists) {
    return {
      reservationId,
      deletedReservation: false,
      deletedGuests: 0
    };
  }

  await commitDeleteByRefs(targets.guestRefs);
  await targets.reservationRef.delete();
  return {
    reservationId,
    deletedReservation: true,
    deletedGuests: targets.guestRefs.length
  };
}

export async function deleteReservationsCascade(reservationIds: string[]) {
  const targetIds = uniqueNonEmpty(reservationIds);
  const results: ReservationCascadeDeleteResult[] = [];
  for (const reservationId of targetIds) {
    results.push(await deleteReservationCascade(reservationId));
  }
  return results;
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
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await adminDb
      .collection('reservation')
      .where('reservationState', 'in', ['ACCEPTED', 'COMPLETED'])
      .orderBy('recordCreationTimeStamp', 'desc')
      .get();
  } catch (error) {
    if (!isFirestoreMissingIndexError(error)) throw error;

    // Fallback path when the composite index is not created yet.
    snap = await adminDb
      .collection('reservation')
      .where('reservationState', 'in', ['ACCEPTED', 'COMPLETED'])
      .get();
  }

  const sortedDocs = [...snap.docs].sort((a, b) => {
    const tsA = Number(a.data()['recordCreationTimeStamp'] ?? 0);
    const tsB = Number(b.data()['recordCreationTimeStamp'] ?? 0);
    return tsB - tsA;
  });

  const orgIds = [...new Set(sortedDocs.map((d) => d.data()['orgId'] as string).filter(Boolean))];
  const orgNames: Record<string, string> = {};
  await Promise.all(
    orgIds.map(async (orgId) => {
      const orgSnap = await adminDb.collection('organization').doc(orgId).get();
      orgNames[orgId] = orgSnap.exists ? (orgSnap.data()?.['name'] ?? orgId) : orgId;
    })
  );

  return sortedDocs.map((doc) => {
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
  role: 'super_admin' | 'admin' | 'support' | 'developer';
  photoURL?: string;
  /** ⚠️ lastActive: Not stored in Firestore */
  lastActive: string;
  /** ⚠️ status: Not stored in Firestore */
  status: 'active' | 'inactive';
  createdAt: string;
}

export async function getAdminTeam(): Promise<AdminMember[]> {
  const snap = await adminDb.collection('user').where('userRole', 'in', ['Admin', 'Developer']).get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const profile = (d['profile'] as Record<string, string | null>) ?? {};
    const firstName = profile['firstName'] ?? '';
    const lastName = profile['lastName'] ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || (d['email'] as string);
    const userRole = d['userRole'] as string | undefined;
    const resolvedRole: AdminMember['role'] =
      userRole === 'Developer'
        ? 'developer'
        : ((d['adminRole'] as AdminMember['role']) ?? 'admin');

    return {
      id: doc.id,
      name: displayName,
      email: (d['email'] as string) ?? '',
      role: resolvedRole,
      photoURL: (d['photoURL'] as string | undefined) ?? undefined,
      lastActive: new Date().toISOString(), // ⚠️ Not stored
      status: 'active', // ⚠️ Not stored
      createdAt: d['createdAt']
        ? new Date((d['createdAt'] as number)).toISOString()
        : new Date().toISOString()
    };
  });
}



// ─── Organization Details: Venues ─────────────────────────────────────────────

export interface OrgVenueRow {
  id: string;
  name: string;
  address: string;
  spaces: number;
  /** ⚠️ rating not stored; default 0 */
  rating: number;
  /** ⚠️ venue status not stored; default 'active' */
  status: 'active' | 'inactive';
}

export async function getVenuesByOrganizationId(orgId: string): Promise<OrgVenueRow[]> {
  const snap = await adminDb.collection('venue').where('orgId', '==', orgId).get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const addressParts = [d['address'], d['city'], d['state']].filter(Boolean);

    return {
      id: doc.id,
      name: (d['name'] as string) ?? 'Unnamed Venue',
      address: addressParts.join(', '),
      spaces: ((d['spaces'] as unknown[]) ?? []).length,
      rating: 0, // ⚠️ not in schema
      status: 'active' // ⚠️ not in schema
    };
  });
}

// ─── Organization Details: Reservations ──────────────────────────────────────

export interface OrgReservationRow {
  id: string;
  client: string;
  email: string;
  venue: string;
  space: string;
  cost: string;
  dateTime: string;
  duration: string;
  status: 'active' | 'inactive';
  amountNumber: number;
}

function formatMoneyUSD(n: number) {
  // keep output like "$27.91" (matches your UI data shape)
  return `$${(Math.round(n * 100) / 100).toFixed(2)}`;
}

function formatDateTime(d: Date) {
  // best-effort: "15 May 2020 8:00 pm" style (without changing UI layout)
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${day} ${month} ${year} ${time}`;
}

export async function getReservationsByOrganizationId(orgId: string): Promise<OrgReservationRow[]> {
  // NOTE: Firestore needs index for where+orderBy sometimes. If it complains,
  // you'll have to create the suggested index in Firebase console.
  const snap = await adminDb
    .collection('reservation')
    .where('orgId', '==', orgId)
    .orderBy('recordCreationTimeStamp', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();

    const amount = (d['totalCost'] as number) ?? 0;

    // Timestamp: recordCreationTimeStamp seems like seconds in your other code
    const createdAt = d['recordCreationTimeStamp']
      ? new Date((d['recordCreationTimeStamp'] as number) * 1000)
      : new Date();

    // These fields are not clearly in schema, so safe fallback to "—"
    const duration = (d['duration'] as string) ?? '—';
    const space = (d['space'] as string) ?? '—';

    const state = (d['reservationState'] as string) ?? 'NEW';
    // Map to your UI's active/inactive badges without changing UI:
    // "active" = not declined; "inactive" = declined/cancelled-like
    const status: 'active' | 'inactive' = ['DECLINED'].includes(state) ? 'inactive' : 'active';

    return {
      id: doc.id,
      client: (d['laceyName'] as string) ?? '—',
      email: (d['laceyEmail'] as string) ?? '—',
      venue: (d['venue'] as string) ?? '—',
      space,
      cost: formatMoneyUSD(amount),
      dateTime: formatDateTime(createdAt),
      duration,
      status,
      amountNumber: amount
    };
  });
}

// ─── Organization Details: Team / Members ────────────────────────────────────

export interface OrgMemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  dateJoined: string;
  status: 'active' | 'inactive';
}


// ─── Organization Details: Activity ──────────────────────────────────────────
// If you don't have a real activity log collection, we should return [] (real).
export type OrgActivityRow = OrgMemberRow;

export async function getOrganizationActivityById(orgId: string): Promise<OrgActivityRow[]> {
  // No activity source in schema you shared — return empty list instead of dummy data.
  return [];
}


// Helper: parse Firestore-ish timestamps you may have (ms number or seconds number)
function toISODate(value: unknown): string {
  if (!value) return '';
  // Most of your sample uses ms int (1760913755283)
  if (typeof value === 'number') {
    const ms = value > 10_000_000_000 ? value : value * 1000; // if seconds, convert
    return new Date(ms).toISOString();
  }
  // If already ISO/string
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return '';
}

function formatDisplayName(profile?: Record<string, unknown>, fallbackEmail?: string) {
  const firstName = (profile?.firstName as string) ?? '';
  const lastName = (profile?.lastName as string) ?? '';
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || fallbackEmail || '—';
}

type OrgMemberRef = {
  userId: string;
  userRole?: string; // "Owner", "Admin", etc (stored on orgMembers)
  email?: string;    // sometimes orgMembers also carry email in your older code
};

// Fetch multiple users by uid (Firestore doc id)
async function getUsersByUids(uids: string[]) {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, Record<string, unknown>>();

  // Firestore "in" query max is 10; chunk it
  const chunkSize = 10;
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += chunkSize) chunks.push(unique.slice(i, i + chunkSize));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const snap = await adminDb.collection('user').where('__name__', 'in', chunk).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
    })
  );

  const map = new Map<string, Record<string, unknown>>();
  results.flat().forEach((u) => map.set(u.id as string, u));
  return map;
}

/** Team member shape used by your UI */
export interface OrganizationTeamMember {
  id: string; // userId
  name: string;
  email: string;
  role: string;
  dateJoined: string; // ISO string (or formatted later)
  status: 'active' | 'inactive';
}

/**
 * Returns org owner details + team members hydrated from `user` docs.
 * - userRole is taken from organization.orgMembers[]
 * - name + createdAt come from user doc
 */
export async function getOrganizationPeopleById(orgId: string): Promise<{
  owner: { userId: string; name: string; email: string; role: string; dateJoined: string } | null;
  team: OrganizationTeamMember[];
}> {
  const orgSnap = await adminDb.collection('organization').doc(orgId).get();
  if (!orgSnap.exists) return { owner: null, team: [] };

  const orgData = orgSnap.data() as Record<string, unknown>;
  const orgMembers = (orgData['orgMembers'] as OrgMemberRef[]) ?? [];

  const memberIds = orgMembers.map((m) => m.userId).filter(Boolean);
  const usersById = await getUsersByUids(memberIds);

  const hydratedTeam: OrganizationTeamMember[] = orgMembers.map((m) => {
    const user = usersById.get(m.userId) ?? {};
    const email = (user['email'] as string) ?? m.email ?? '';
    const profile = (user['profile'] as Record<string, unknown>) ?? undefined;

    return {
      id: m.userId,
      name: formatDisplayName(profile, email),
      email,
      role: m.userRole ?? 'Member',
      dateJoined: toISODate(user['createdAt']),
      status: 'active'
    };
  });

  const ownerMember =
    orgMembers.find((m) => (m.userRole ?? '').toLowerCase() === 'owner') ?? orgMembers[0] ?? null;

  const ownerUser = ownerMember ? (usersById.get(ownerMember.userId) ?? {}) : null;
  const ownerEmail =
    (ownerUser?.['email'] as string) ?? ownerMember?.email ?? '';

  const ownerProfile = (ownerUser?.['profile'] as Record<string, unknown>) ?? undefined;

  const owner =
    ownerMember
      ? {
          userId: ownerMember.userId,
          name: formatDisplayName(ownerProfile, ownerEmail),
          email: ownerEmail,
          role: ownerMember.userRole ?? 'Owner', // this is your "title/position"
          dateJoined: toISODate(ownerUser?.['createdAt'])
        }
      : null;

  return { owner, team: hydratedTeam };
}
