import { memo } from 'react';

import { motion } from 'framer-motion';

import { Button } from '@repo/ui/components/base/button';
import { AlertTriangle, Bug, RefreshCw } from '@repo/ui/lib/icons';

import type { ErrorComponentProps } from '@tanstack/react-router';

function CatchBoundary(props: ErrorComponentProps) {
  const { error } = props;

  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="bg-background relative flex h-screen w-full items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-error/5 absolute top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <div className="bg-error-muted ring-error/20 flex h-20 w-20 items-center justify-center rounded-full ring-1">
              <AlertTriangle className="text-error h-10 w-10" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-error/10 absolute inset-0 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-foreground mb-3 text-2xl font-bold">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground mb-6 text-base">
            We encountered an unexpected error. Don&apos;t worry, our team has
            been notified and is working on it.
          </p>

          {isDevelopment && error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-error/20 bg-error-muted mb-6 overflow-hidden rounded-xl border p-4 text-left"
            >
              <div className="mb-2 flex items-center gap-2">
                <Bug className="text-error h-4 w-4" />
                <span className="text-error-muted-foreground text-sm font-semibold">
                  Error Details
                </span>
              </div>
              <pre className="text-error overflow-x-auto text-xs">
                {error.message || 'Unknown error'}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-error/70 hover:text-error cursor-pointer text-xs">
                    Stack trace
                  </summary>
                  <pre className="text-error/50 mt-2 max-h-40 overflow-auto text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </motion.div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary h-11 rounded-xl px-6"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default memo(CatchBoundary);
