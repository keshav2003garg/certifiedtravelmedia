import { memo } from 'react';

import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';

import { LayoutGrid } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

function AuthMobileHeader() {
  return (
    <motion.nav
      className={cn(
        'border-border sticky top-0 z-50 w-full border-b lg:hidden',
        'bg-navy',
      )}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-center px-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Link to="/" className="group flex items-center gap-3">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm"
              whileHover={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <LayoutGrid className="text-gold h-5 w-5" />
            </motion.div>

            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">CTM Grid</span>
              <span className="text-gold text-[10px] font-medium">
                Admin Panel
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );
}

export default memo(AuthMobileHeader);
