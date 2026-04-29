// Node Modules
import { render } from '@react-email/render';
import { createTransport } from 'nodemailer';

// Templates
import { EmailVerification, ResetPassword } from './templates/auth.templates';
import { SyncError } from './templates/sync-error.template';

import type { Transporter } from 'nodemailer';
// Types
import type { MailTemplate, SendMail } from './types';

export default class EmailService {
  private name: string;
  private mail: string;
  private replyTo: string;
  private transporter: Transporter;

  constructor(
    name: string,
    mail: string,
    replyTo: string,
    host: string,
    port: number,
    username: string,
    password: string,
  ) {
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
    });

    this.name = name;
    this.mail = mail;
    this.replyTo = replyTo;
  }

  async getTemplate(template: MailTemplate) {
    switch (template.type) {
      case 'emailVerification':
        return await render(EmailVerification(template.data));
      case 'resetPassword':
        return await render(ResetPassword(template.data));
      case 'syncError':
        return await render(SyncError(template.data));
    }
  }

  async sendEmail(args: SendMail) {
    await this.transporter.sendMail({
      from: {
        name: this.name,
        address: this.mail,
      },
      replyTo: this.replyTo,
      to: args.to,
      cc: args.cc,
      subject: args.subject,
      html: await this.getTemplate(args.template),
    });
  }
}
