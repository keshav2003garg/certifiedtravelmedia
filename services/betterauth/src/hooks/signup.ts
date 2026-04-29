import { APIError, createAuthMiddleware } from 'better-auth/api';

/**
 * Before hook that checks for duplicate email on signup.
 *
 * - If a **verified** user with the same email exists → throws an error.
 * - If an **unverified** user exists → deletes the stale record so the
 *   signup can proceed fresh (new user + new verification email).
 * - If no user exists → passes through normally.
 */
export function createSignupHook() {
  return createAuthMiddleware(async (ctx) => {
    if (ctx.path !== '/sign-up/email') {
      return;
    }

    const email = ctx.body?.email?.toLowerCase();
    if (!email) {
      return;
    }

    const existingUser =
      await ctx.context.internalAdapter.findUserByEmail(email);

    if (!existingUser) {
      return;
    }

    if (existingUser.user.emailVerified) {
      throw new APIError('UNPROCESSABLE_ENTITY', {
        message: 'A user with this email already exists',
      });
    }

    // User exists but email is NOT verified – remove the stale record
    // so the fresh signup can proceed and send a new verification email.
    await ctx.context.internalAdapter.deleteUser(existingUser.user.id);
  });
}
