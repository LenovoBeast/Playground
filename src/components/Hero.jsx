import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Terminal, Cpu, ChevronRight, Menu, X } from 'lucide-react';

const Hero = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.32, 0.72, 0, 1],
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.32, 0.72, 0, 1],
        delay: 0.6,
      },
    },
  };

  return (
    <>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 ${
          scrolled ? 'py-4' : 'py-6'
        }`}
      >
        <motion.div
          className="max-w-7xl mx-auto flex items-center justify-between glass-strong rounded-full px-6 py-3 shadow-2xl shadow-black/50"
          whileHover={{ y: -2, boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.15)' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20"
              whileHover={{ scale: 1.1, rotate: 6 }}
              transition={{ duration: 0.3 }}
            >
              <Terminal size={18} className="text-white" />
            </motion.div>
            <span className="font-bold text-xl tracking-tighter uppercase">Nexus<span className="text-purple-500">.</span></span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm font-medium text-gray-400 transition-all duration-300 ${
            mobileMenuOpen ? 'absolute top-full left-6 right-6 md:relative md:absolute md:top-auto md:left-auto md:right-auto flex-col md:flex-row bg-obsidian/95 backdrop-blur-md p-6 md:p-0 rounded-3xl md:rounded-full shadow-2xl border border-white/10' : ''
          }`}>
            {['Projects', 'Builds', 'Stack', 'About'].map((item, idx) => (
              <motion.a
                key={item}
                href="#"
                className="hover:text-white transition-colors md:hover:bg-transparent md:p-0"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.05, textShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              className="hidden sm:flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Github size={16} /> GitHub
            </motion.button>
            <motion.button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9, rotate: 180 }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </motion.div>
      </motion.nav>

      {/* Hero section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden flex justify-center">
        {/* Background Decorative Elements */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
          style={{ animation: 'float 20s ease-in-out infinite' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1], delay: 0.5 }}
          style={{ animation: 'float 15s ease-in-out infinite reverse' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0v60h60V0z' fill='none' stroke='white' stroke-width='0.5'%3E%3C/path%3E%3C/svg%3E")`
          }}
        />

        <motion.div
          className="relative max-w-5xl mx-auto text-center z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8 text-xs font-mono tracking-widest text-cyan-400 uppercase"
            variants={itemVariants}
            style={{ animation: 'pulse-ring 2s ease-out infinite' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Available now: v2.0
          </motion.div>

          <motion.h1
            className="text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[0.9] mb-8 uppercase italic"
            variants={itemVariants}
          >
            Crafting <br />
            <span className="gradient-text">
              Digital Frontiers
            </span>
          </motion.h1>

          <motion.p
            className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-10 leading-relaxed"
            variants={itemVariants}
          >
            Architecting high-performance gaming experiences and immersive digital tools
            built for the next generation of the web.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={itemVariants}
          >
            <motion.button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all shadow-xl shadow-purple-600/25 group active:scale-95"
              whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              View Projects
              <motion.div
                className="group-hover:translate-x-1 transition-transform"
                layoutId="arrow"
              >
                <ChevronRight size={20} />
              </motion.div>
            </motion.button>
            <motion.button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-xl font-bold transition-all active:scale-95"
              whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px -10px rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              Tech Stack
              <Cpu size={20} />
            </motion.button>
          </motion.div>

          {/* Stats Mockup */}
          <motion.div
            className="mt-20 flex flex-wrap justify-center gap-12 md:gap-24 opacity-50"
            variants={statsVariants}
          >
            <StatItem value="12k+" label="Lines Code" delay={0} />
            <StatItem value="99%" label="Uptime" delay={0.1} />
            <StatItem value="45+" label="Deployed" delay={0.2} />
          </motion.div>
        </motion.div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(-50%, 0) scale(1); }
            50% { transform: translate(-50%, -30px) scale(1.02); }
          }
          @keyframes pulse-ring {
            0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
          }
        `}</style>
      </section>
    </>
  );
};

const StatItem = ({ value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.7 + delay }}
    whileHover={{ scale: 1.1 }}
  >
    <div className="text-3xl font-bold">{value}</div>
    <div className="text-xs uppercase tracking-widest">{label}</div>
  </motion.div>
);

export default Hero;