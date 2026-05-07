import { memo } from 'react';

import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';

import { Button } from '@repo/ui/components/base/button';
import { ArrowLeft, Search } from '@repo/ui/lib/icons';

interface NotFoundProps {
  children?: React.ReactNode;
}

function NotFound(props: NotFoundProps) {
  const { children } = props;
  const router = useRouter();

  if (children) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background relative flex h-screen w-full items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-primary/8 absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-foreground/6 text-[160px] leading-none font-bold select-none">
              404
            </span>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-primary/10 ring-primary/20 flex h-20 w-20 items-center justify-center rounded-full ring-1">
                <Search className="text-primary h-9 w-9" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-foreground mb-3 text-2xl font-bold">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => router.history.back()}
              className="border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary h-11 rounded-xl px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default memo(NotFound);
