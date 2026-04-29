import type { BetterAuthOptions } from 'better-auth';
import type EmailService from '@services/email';

export function createEmailPasswordConfig(
  emailService: EmailService,
): BetterAuthOptions['emailAndPassword'] {
  return {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword(data) {
      await emailService.sendEmail({
        to: data.user.email,
        subject: 'Reset your password',
        template: {
          type: 'resetPassword',
          data: {
            url: data.url,
            name: data.user.name,
          },
        },
      });
    },
  };
}
