import React from 'react';

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

const colors = {
  navy: '#0E385E',
  blue: '#0089CF',
  gold: '#FECF04',
};

interface EmailVerificationProps {
  url: string;
  name: string;
}

export function EmailVerification(props: EmailVerificationProps) {
  return (
    <Tailwind>
      <Html lang="en">
        <Head />
        <Preview>Verify your CTM Grid Generator email address</Preview>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-145 px-6 pt-10 pb-12">
            <Section className="mb-8 text-center">
              <div
                style={{
                  backgroundColor: colors.navy,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '8px',
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                  }}
                >
                  CTM Grid Generator
                </Text>
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: '12px',
                    fontWeight: '500',
                    margin: '4px 0 0 0',
                    letterSpacing: '0.5px',
                  }}
                >
                  ADMIN DASHBOARD
                </Text>
              </div>
            </Section>

            <Section className="rounded-2xl border border-gray-200 bg-white px-12 py-10 shadow">
              <Text className="mb-4 text-center text-2xl font-bold text-gray-900">
                Email Verification
              </Text>

              <Text className="mb-6 text-base leading-relaxed text-gray-700">
                Hi {props.name},
              </Text>

              <Text className="mb-6 text-base leading-relaxed text-gray-700">
                Welcome to CTM Grid Generator! To complete your account setup
                and start managing brochure grids, please verify your email
                address by clicking the button below.
              </Text>

              <Section className="my-8 text-center">
                <a
                  href={props.url}
                  style={{
                    display: 'inline-block',
                    backgroundColor: colors.blue,
                    color: '#ffffff',
                    padding: '14px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  Verify Email Address
                </a>
              </Section>

              <Text className="mb-2 text-sm leading-relaxed text-gray-700">
                This link will expire in 1 hour.
              </Text>

              <Text className="mb-6 text-sm leading-relaxed text-gray-700">
                If the button above doesn't work, you can copy and paste the
                following link into your browser:
              </Text>

              <div className="mb-6 rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                <Text className="m-0 font-mono text-sm break-all text-gray-700">
                  {props.url}
                </Text>
              </div>

              <Hr className="my-8 border-gray-200" />

              <Text className="mb-6 text-sm leading-relaxed text-gray-700">
                If you didn't create an account with CTM Grid Generator, please
                ignore this email.
              </Text>
            </Section>

            <Section className="px-12">
              <Text className="mt-8 text-center text-xs leading-relaxed text-gray-500">
                This message was produced and distributed by Certified Travel
                Media.
                <br />© {new Date().getFullYear()} Certified Travel Media. All
                rights reserved.
              </Text>

              <Text className="mt-4 text-center text-xs text-gray-400">
                If you have any questions, contact our support team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

interface ResetPasswordProps {
  url: string;
  name: string;
}

export function ResetPassword(props: ResetPasswordProps) {
  return (
    <Tailwind>
      <Html lang="en">
        <Head />
        <Preview>Reset your CTM Grid Generator password</Preview>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-145 px-6 pt-10 pb-12">
            <Section className="mb-8 text-center">
              <div
                style={{
                  backgroundColor: colors.navy,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '8px',
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                  }}
                >
                  CTM Grid Generator
                </Text>
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: '12px',
                    fontWeight: '500',
                    margin: '4px 0 0 0',
                    letterSpacing: '0.5px',
                  }}
                >
                  ADMIN DASHBOARD
                </Text>
              </div>
            </Section>

            <Section className="rounded-2xl border border-gray-200 bg-white px-12 py-10 shadow">
              <Text className="mb-4 text-center text-2xl font-bold text-gray-900">
                Password Reset
              </Text>

              <Text className="mb-6 text-base leading-relaxed text-gray-700">
                Hi {props.name},
              </Text>

              <Text className="mb-6 text-base leading-relaxed text-gray-700">
                We received a request to reset your CTM Grid Generator account
                password. If you made this request, please click the button
                below to set a new password.
              </Text>

              <Section className="my-8 text-center">
                <a
                  href={props.url}
                  style={{
                    display: 'inline-block',
                    backgroundColor: colors.blue,
                    color: '#ffffff',
                    padding: '14px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  Reset Password
                </a>
              </Section>

              <Text className="mb-6 text-sm leading-relaxed text-gray-700">
                If the button above doesn't work, you can copy and paste the
                following link into your browser:
              </Text>

              <div className="mb-6 rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                <Text className="m-0 font-mono text-sm break-all text-gray-700">
                  {props.url}
                </Text>
              </div>

              <Text className="mb-6 text-sm leading-relaxed text-gray-700">
                This link will expire in 1 hour for security reasons.
              </Text>

              <Hr className="my-8 border-gray-200" />

              <Text className="mb-6 text-sm leading-relaxed text-gray-700">
                If you didn't request a password reset, please ignore this
                email. Your password will remain unchanged.
              </Text>
            </Section>

            <Section className="px-12">
              <Text className="mt-8 text-center text-xs leading-relaxed text-gray-500">
                This message was produced and distributed by Certified Travel
                Media.
                <br />© {new Date().getFullYear()} Certified Travel Media. All
                rights reserved.
              </Text>

              <Text className="mt-4 text-center text-xs text-gray-400">
                If you have any questions, contact our support team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
