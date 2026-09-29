import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { House, ArrowULeftDown, Compass, Sparkle, MagnifyingGlass } from '@phosphor-icons/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-a left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 bg-blue-600/20" />
        <div className="grid-veil absolute inset-0 opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-10">
          <motion.div
            className="relative mx-auto mb-6 grid h-28 w-28 place-items-center"
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 4 }}
          >
            <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/40 to-indigo-500/30 blur-xl" />
            <span className="absolute inset-0 rounded-3xl border border-white/10 bg-white/[0.04]" />
            <span className="animate-spin-slower absolute -inset-3 rounded-[2rem] border border-dashed border-white/12" />
            <motion.span
              className="relative text-4xl font-black text-blue-300"
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.4 }}
            >
              404
            </motion.span>
          </motion.div>

          <motion.h1
            className="mb-4 text-4xl font-black uppercase italic tracking-tighter md:text-6xl"
            variants={itemVariants}
          >
            Page Not Found
          </motion.h1>

          <motion.p className="text-lg leading-relaxed text-zinc-400" variants={itemVariants}>
            The digital frontier you&apos;re looking for doesn&apos;t exist. Maybe it was lost in the
            void, or never deployed.
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link
            to="/"
            className="magnetic-btn btn-sweep active-press relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 sm:w-auto"
          >
            <House size={18} weight="bold" />
            Back to Nexus
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-8 py-4 font-bold backdrop-blur-xl transition-all hover:bg-white/[0.07] active-press sm:w-auto"
          >
            <ArrowULeftDown size={18} weight="bold" />
            Go Back
          </button>
        </motion.div>

        <motion.div
          className="mt-16 flex items-center justify-center gap-8 opacity-60"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white">
            <Compass size={16} weight="bold" /> Explore
          </Link>
          <Link to="/#projects" className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white">
            <Sparkle size={16} weight="bold" /> Projects
          </Link>
          <Link to="/#contact" className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white">
            <MagnifyingGlass size={16} weight="bold" /> Contact
          </Link>
        </motion.div>
      </div>
    </section>
  );
}