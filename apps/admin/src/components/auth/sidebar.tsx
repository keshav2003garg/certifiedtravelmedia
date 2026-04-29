import { memo } from 'react';

import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';

import { LayoutGrid, MapPin, RefreshCw, Zap } from '@repo/ui/lib/icons';

const features = [
  {
    icon: LayoutGrid,
    title: 'Automated Grid Generation',
    description:
      'Automatically generate mobile-friendly brochure placement grids from your Acumatica contract data',
  },
  {
    icon: Zap,
    title: 'Real-Time Sync',
    description:
      'Seamlessly push updated grids to Route4Me, ensuring drivers always have the latest placement info',
  },
  {
    icon: RefreshCw,
    title: 'Smart Tier Sorting',
    description:
      'Automatically prioritize Tier 1 Premium clients above Tier 2 Standard for optimal placement',
  },
  {
    icon: MapPin,
    title: 'Route Integration',
    description:
      "Direct integration with Route4Me puts the right grid in drivers' hands at every stop",
  },
];

function AuthSidebar() {
  return (
    <div className="bg-navy relative hidden overflow-hidden lg:block lg:w-1/2">
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full border border-white/10"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 100,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="pointer-events-none absolute -bottom-48 -left-48 h-125 w-125 rounded-full border border-white/10"
      />

      <div className="bg-blue/20 pointer-events-none absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl" />

      <div className="relative z-10 flex h-full flex-col justify-between px-12 py-16">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <Link to="/" className="group inline-block">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                    <LayoutGrid className="text-gold h-8 w-8" />
                  </div>
                </motion.div>
              </Link>

              <h1 className="mb-3 text-2xl font-bold text-white">
                Certified Travel Media
              </h1>
              <p className="text-lg text-white/70">Brochure Grid Generator</p>
              <p className="text-gold mt-2 text-sm font-medium">
                Admin Dashboard
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index + 0.3, duration: 0.5 }}
                    className="group flex items-start gap-4"
                  >
                    <div className="group-hover:ring-gold/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/15">
                      <Icon className="group-hover:text-gold h-5 w-5 text-white/70 transition-colors" />
                    </div>

                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-white/60">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <div className="mx-auto mb-3 h-px w-20 bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
            Streamlined Brochure Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default memo(AuthSidebar);
