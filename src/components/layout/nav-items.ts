import type { NavItem } from '$lib/types';

// Import SVG files as Svelte components
import HomeIcon from '$lib/assets/icons/home-icon.svg';
import OrgIcon from '$lib/assets/icons/org-icon.svg';
import VenueIcon from '$lib/assets/icons/venue-icon.svg';
import ReserveIcon from '$lib/assets/icons/reservations-icon.svg';
import RevenueIcon from '$lib/assets/icons/revenue-icon.svg';
import TeamIcon from '$lib/assets/icons/team-icon.svg';
import AuditIcon from '$lib/assets/icons/audit-icon.svg';
import HelpIcon from '$lib/assets/icons/help-icon.svg';
import SettingsIcon from '$lib/assets/icons/settings.svg';

export const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: HomeIcon },
  { label: 'Organizations', href: '/dashboard/organizations', icon: OrgIcon },
  { label: 'Venues', href: '/dashboard/venues', icon: VenueIcon },
  { label: 'Reservations', href: '/dashboard/reservations', icon: ReserveIcon },
  { label: 'Revenues', href: '/dashboard/revenues', icon: RevenueIcon },
  { label: 'Admin Team', href: '/dashboard/admin-team', icon: TeamIcon },
  { label: 'Audit Log', href: '/dashboard/audit-log', icon: AuditIcon },
];

export const supportNavItems: NavItem[] = [
  { label: 'Help Center', href: '/help', icon: HelpIcon },
  { label: 'Settings', href: '/dashboard/settings', icon: SettingsIcon }
];
