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
  red: '#DC2626',
  green: '#16A34A',
};

interface SyncStepResult {
  step: string;
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SyncErrorProps {
  timestamp: string;
  durationSeconds: string;
  failedSteps: SyncStepResult[];
  allSteps: SyncStepResult[];
}

export function SyncError(props: SyncErrorProps) {
  const failedCount = props.failedSteps.length;
  const totalCount = props.allSteps.length;

  return (
    <Tailwind>
      <Html lang="en">
        <Head />
        <Preview>
          Sync Failed — {String(failedCount)} of {String(totalCount)} steps
          failed
        </Preview>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-150 px-6 pt-10 pb-12">
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
                  INTEGRATION SYNC
                </Text>
              </div>
            </Section>

            <Section className="mb-6">
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  textAlign: 'center' as const,
                }}
              >
                <Text
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: colors.red,
                    margin: '0 0 4px 0',
                  }}
                >
                  ⚠ Sync Failed
                </Text>
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#991B1B',
                    margin: 0,
                  }}
                >
                  {failedCount} of {totalCount} sync steps failed on{' '}
                  {props.timestamp}
                </Text>
              </div>
            </Section>

            <Section className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow">
              <Text
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                }}
              >
                Sync Summary
              </Text>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      margin: '0 0 2px 0',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Duration
                  </Text>
                  <Text
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                    }}
                  >
                    {props.durationSeconds}s
                  </Text>
                </div>
              </div>

              <Hr style={{ borderColor: '#E5E7EB', margin: '20px 0' }} />

              <Text
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px',
                }}
              >
                Step Details
              </Text>

              {props.allSteps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: step.success ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${step.success ? '#BBF7D0' : '#FECACA'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: step.error ? '8px' : '0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '16px',
                        margin: '0 8px 0 0',
                      }}
                    >
                      {step.success ? '✅' : '❌'}
                    </Text>
                    <Text
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: step.success ? '#166534' : '#991B1B',
                        margin: 0,
                      }}
                    >
                      Step {index + 1}: {step.step}
                    </Text>
                    <Text
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: step.success ? colors.green : colors.red,
                        margin: '0 0 0 auto',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {step.success ? 'Passed' : 'Failed'}
                    </Text>
                  </div>

                  {step.error && (
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginTop: '8px',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#991B1B',
                          margin: '0 0 4px 0',
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.5px',
                        }}
                      >
                        Error Message
                      </Text>
                      <Text
                        style={{
                          fontSize: '13px',
                          color: '#7F1D1D',
                          fontFamily: 'monospace',
                          margin: 0,
                          lineHeight: '1.5',
                          wordBreak: 'break-all' as const,
                        }}
                      >
                        {step.error}
                      </Text>
                    </div>
                  )}

                  {step.success && step.details && (
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginTop: '8px',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: '13px',
                          color: '#166534',
                          fontFamily: 'monospace',
                          margin: 0,
                          lineHeight: '1.5',
                        }}
                      >
                        {Object.entries(step.details)
                          .filter(([k]) => k !== 'success')
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </Text>
                    </div>
                  )}
                </div>
              ))}
            </Section>

            <Section className="px-12">
              <Text className="mt-8 text-center text-xs leading-relaxed text-gray-500">
                This is an automated alert from CTM Grid Generator.
                <br />
                Please investigate and resolve the failed sync steps.
              </Text>
              <Text className="mt-4 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Certified Travel Media. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
