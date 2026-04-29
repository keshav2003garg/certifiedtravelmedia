interface EmailVerification {
  type: 'emailVerification';
  data: {
    name: string;
    url: string;
  };
}

interface ResetPassword {
  type: 'resetPassword';
  data: {
    name: string;
    url: string;
  };
}

interface SyncError {
  type: 'syncError';
  data: {
    timestamp: string;
    durationSeconds: string;
    failedSteps: {
      step: string;
      success: boolean;
      error?: string;
      details?: Record<string, unknown>;
    }[];
    allSteps: {
      step: string;
      success: boolean;
      error?: string;
      details?: Record<string, unknown>;
    }[];
  };
}

export type MailTemplate = EmailVerification | ResetPassword | SyncError;

export interface SendMail {
  to: string;
  cc?: string | string[];
  subject: string;
  template: MailTemplate;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}
