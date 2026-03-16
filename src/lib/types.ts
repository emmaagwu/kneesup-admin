import type { ComponentType, SvelteComponent } from 'svelte';


// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'support';
  createdAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface StatCard {
  label: string;
  value: string | number;
  change: number; // percentage vs last week
  changeLabel: string;
  icon: string;
}

// ─── Organization ─────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  logoURL?: string;
  venueCount: number;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

// ─── Venue ────────────────────────────────────────────────────────────────────
export interface Venue {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  address: string;
  capacity: number;
  pricePerHour: number;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  createdAt: string;
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  venueName: string;
  organizationName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

// ─── Revenue ─────────────────────────────────────────────────────────────────
export interface RevenueRecord {
  id: string;
  organizationName: string;
  venueName: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  date: string;
  reservationId: string;
}

// ─── Admin Team ───────────────────────────────────────────────────────────────
export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  photoURL?: string;
  lastActive: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

// export interface NavItem {
//   label: string;
//   href: string;
//   // This allows you to pass the imported SVG component
//   icon: ComponentType<SvelteComponent>; 
// }

export interface NavItem {
  label: string;
  href: string;
  // This allows you to pass the imported SVG component
  icon: string; 
}