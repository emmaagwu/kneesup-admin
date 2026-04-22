# KneesUp Admin - Project Status (Codebase Review)

Last reviewed: 2026-03-30

## 1) What this project is about

`kneesup-admin` is a SvelteKit admin portal for platform-level operations across the KneesUp ecosystem (organizations, venues, reservations, revenues, and admin access).

Core intent in the current code:
- Authenticate admins with Firebase Auth.
- Create server-managed HttpOnly sessions.
- Gate all dashboard routes to users with Firestore `userRole === "Admin"`.
- Provide operational dashboards over existing Firestore data used by the host/venues systems.

Tech stack in use:
- SvelteKit + TypeScript + Tailwind CSS
- Firebase client SDK + Firebase Admin SDK
- Firestore as the primary data source
- Playwright + Vitest configured (light test coverage at the moment)

## 2) What has been done

### Authentication and access control
- Implemented login UI with email/password and Google sign-in.
- Implemented token exchange endpoint (`POST /api/auth/session`) that:
	- verifies Firebase ID token,
	- checks Firestore admin role,
	- sets secure HttpOnly cookie session.
- Implemented logout endpoint (`DELETE /api/auth/session`) and client logout flow.
- Implemented global server hook that verifies session cookie on each request.
- Implemented route protection for dashboard group (`redirect /login` when not authenticated).

### Data integration (server-side)
- Built server DB service layer for:
	- platform stats,
	- reservations (recent + full list),
	- organizations list/details,
	- top organizations,
	- venues list,
	- revenue records,
	- admin team list,
	- organization team/member hydration.
- Dashboard pages are wired to server `+page.server.ts` loaders for:
	- `/dashboard`
	- `/dashboard/organizations`
	- `/dashboard/organizations/[id]`
	- `/dashboard/venues`
	- `/dashboard/reservations`
	- `/dashboard/revenues`
	- `/dashboard/admin-team`

### UI and UX work completed
- Built a complete dashboard shell:
	- responsive sidebar,
	- mobile nav,
	- topbar + breadcrumbs,
	- card/table/list patterns.
- Implemented substantial UI for organizations and venues management flows (drawers, multi-step forms, filters, pagination, action menus, status badges).
- Added forgotten-password UX flow (request + done screens).

### Project scaffolding and tooling
- Linting/formatting/test scripts are configured.
- Playwright config is present and runs against preview build.
- App typing for `App.Locals.user` is set up correctly.

## 3) Current limitations / partial implementations

### Important: some sections are UI-complete but action-incomplete
- Several create/update/block actions are still local-state only and do not persist to backend yet.
- Explicit TODO markers exist for API calls in key management screens.

### Firestore schema mismatch handling currently uses fallbacks
- Multiple fields are not in current schema, so placeholders/defaults are used in code:
	- organization status, phone, createdAt
	- venue status, rating
	- admin status/lastActive
	- activity logs
- Revenue fee is currently estimated at a fixed 10% (not sourced from Stripe payout truth).

### Some routes/links are currently broken or missing
- `/dashboard/audit-log` has no active `+page.svelte` route (only `_+page.svelte` exists).
- Links point to routes that do not exist yet, including:
	- `/dashboard/admin-team/new`
	- `/dashboard/admin-team/[id]`
	- `/dashboard/organizations/new`
	- `/dashboard/organizations/[id]/edit`
	- `/dashboard/settings`
	- `/help`

### One major page is still mock-data driven
- `/dashboard/venues/[id]` is implemented as a large static/mock page and is not backed by server loader/API persistence.

### Auth flow not fully complete
- Forgot password page still uses mock delay; Firebase reset email call is TODO.

### Test coverage is still minimal
- Playwright has a basic demo assertion test.
- No robust end-to-end tests yet for auth/session guard, dashboard loaders, or CRUD-like flows.

## 4) What is yet to be done

## Phase A - make existing UI truly functional (highest priority)
1. Implement real mutation APIs (`+server.ts`) for:
	 - organizations create/update/block,
	 - venues create/update/block,
	 - admin team create/update/deactivate.
2. Connect current drawer/modal handlers to those APIs.
3. Replace placeholder success toasts with actual success/error responses.

## Phase B - fix routing and navigation correctness
1. Add missing routes currently linked by UI, or remove links until available.
2. Implement a real `audit-log` route and wire to data source.
3. Add `settings` and `help` destinations or disable those nav items.

## Phase C - remove remaining mock logic
1. Replace forgot-password mock with `sendPasswordResetEmail`.
2. Convert `/dashboard/venues/[id]` to real loader + backend-backed mutations.
3. Replace static sample data structures in venue details with Firestore data.

## Phase D - harden data correctness
1. Decide and document source-of-truth for platform fees and net payouts (prefer Stripe sync over fixed 10% assumption).
2. Add missing Firestore fields (or new collections) needed by admin UI:
	 - org/venue status,
	 - activity logs,
	 - admin metadata (lastActive, status),
	 - optional organization createdAt/phone.
3. Add required Firestore composite indexes for where+orderBy queries.

## Phase E - quality and release readiness
1. Add E2E tests for:
	 - login/logout/session expiration,
	 - admin-role gate,
	 - all data-backed dashboard pages,
	 - at least one create/edit flow end-to-end.
2. Add integration tests for session endpoint and db service transforms.
3. Replace default root landing page (`/`) with product-appropriate redirect or landing.
4. Update root README from Svelte template text to project-specific setup/run/deploy docs.

## 5) Overall assessment

Current maturity: **mid-stage implementation**.

What is strong now:
- Security architecture direction (server session + role gate) is good.
- Core read-only data dashboards are mostly wired and usable.
- UI system is comprehensive and responsive.

What blocks production readiness:
- Missing mutation APIs and unresolved TODO actions.
- Broken/missing routes referenced by UI.
- One major venue details area still mock-driven.
- Limited automated test coverage.

Short summary: this is no longer a blank scaffold; it is a substantial admin app foundation with working auth and data read paths, but it still needs backend write flows, route completion, and testing before it can be considered production-ready.
