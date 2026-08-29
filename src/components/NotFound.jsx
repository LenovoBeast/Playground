import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, RotateCcw, Search, Sparkles } from 'lucide-react';

const NotFound = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
    },
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 bg-obsidian relative overflow-hidden noise-overlay">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-pink-600/5" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
        style={{ animation: 'float 20s ease-in-out infinite' }}
      />

      <div className="relative z-10 text-center max-w-md mx-auto">
        <motion.div
          className="mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 mb-6"
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <motion.span
              className="text-4xl font-black text-purple-500"
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              404
            </motion.span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4"
            variants={itemVariants}
          >
            Page Not Found
          </motion.h1>

          <motion.p
            className="text-gray-400 text-lg mb-10 leading-relaxed"
            variants={itemVariants}
          >
            The digital frontier you're looking for doesn't exist.
            Maybe it was lost in the void, or never deployed.
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white transition-all shadow-xl shadow-purple-600/25 group active:scale-95"
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/'}
          >
            <Home size={20} />
            Back to Nexus
          </motion.button>
          <motion.button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-xl font-bold transition-all active:scale-95"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
          >
            <RotateCcw size={20} />
            Go Back
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-16 flex items-center justify-center gap-8 opacity-50"
          variants={itemVariants}
          transition={{ delay: 0.5 }}
        >
          <a href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <Search size={18} /> Explore
          </a>
          <a href="#projects" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <Sparkles size={18} /> Projects
          </a>
          <a href="#contact" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <Home size={18} /> Contact
          </a>
        </motion.div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.03) translateY(-15px); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default NotFound;