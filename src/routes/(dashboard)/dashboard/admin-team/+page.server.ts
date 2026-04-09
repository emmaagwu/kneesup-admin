import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { deleteUserAccounts, getAdminTeam, previewDeleteUserAccounts, resolveUserIdsByEmails } from '$lib/server/db';

const PROTECTED_USER_EMAILS = [
  'support@kneesupcorp.com',
  'support@kneesupvenues.com',
  'chris@kneesupcorp.com'
];

async function getProtectedUserIds(currentUserId?: string) {
  const ids = await resolveUserIdsByEmails(PROTECTED_USER_EMAILS);
  if (currentUserId) ids.push(currentUserId);
  return [...new Set(ids.filter(Boolean))];
}

export const load: PageServerLoad = async ({ locals }) => {
  const admins = await getAdminTeam();
  return { admins, canDelete: locals.user?.role === 'developer' };
};

export const actions: Actions = {
  previewSelectedUsers: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can preview deletion impact.' });
    }

    const formData = await request.formData();
    const userIds = formData.getAll('userIds').map((value) => String(value).trim()).filter(Boolean);
    if (userIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one user to preview.' });
    }

    const protectedUserIds = await getProtectedUserIds(locals.user?.uid);
    const { results, skippedProtected } = await previewDeleteUserAccounts(userIds, protectedUserIds);
    const existing = results.filter((result) => result.userExists);
    const missing = results.length - existing.length;

    return {
      successMessage: `Dry run complete for ${userIds.length} user(s).`,
      dryRunReport: {
        users: existing.length,
        organizationsToDetach: existing.reduce((sum, result) => sum + result.organizationsToDetach, 0),
        missing,
        skippedProtected
      }
    };
  },

  deleteOneUser: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can delete users.' });
    }

    const formData = await request.formData();
    const userId = String(formData.get('userId') ?? '').trim();
    if (!userId) {
      return fail(400, { errorMessage: 'User id is required.' });
    }
    const protectedUserIds = await getProtectedUserIds(locals.user?.uid);

    const { results, skippedProtected } = await deleteUserAccounts([userId], protectedUserIds);
    if (skippedProtected > 0) {
      return fail(403, {
        errorMessage:
          'This account is protected and cannot be deleted (support/chris or your active admin session).'
      });
    }

    const deleted = results[0]?.deletedUser;
    if (!deleted) {
      return fail(404, { errorMessage: 'User not found or already removed.' });
    }

    return { successMessage: 'User account deleted successfully.' };
  },

  deleteSelectedUsers: async ({ request, locals }) => {
    if (locals.user?.role !== 'developer') {
      return fail(403, { errorMessage: 'Only Developer role can delete users.' });
    }

    const formData = await request.formData();
    const userIds = formData.getAll('userIds').map((value) => String(value).trim()).filter(Boolean);
    if (userIds.length === 0) {
      return fail(400, { errorMessage: 'Select at least one user to delete.' });
    }

    const protectedUserIds = await getProtectedUserIds(locals.user?.uid);
    const { results, skippedProtected } = await deleteUserAccounts(userIds, protectedUserIds);
    const deletedUsers = results.filter((result) => result.deletedUser).length;
    const missingUsers = results.length - deletedUsers;

    return {
      successMessage: `Deleted ${deletedUsers} user(s).${missingUsers ? ` Skipped ${missingUsers} missing user(s).` : ''}${skippedProtected ? ` Skipped ${skippedProtected} protected active session user.` : ''}`
    };
  }
};
