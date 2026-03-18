// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AdminUser } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by hooks.server.ts after verifying the session cookie */
			user: AdminUser | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
