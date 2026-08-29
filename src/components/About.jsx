import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Zap, Globe, Users, Award, Target } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Projects Shipped', icon: Code2 },
  { value: '50k+', label: 'Hours Coded', icon: Zap },
  { value: '12', label: 'Countries Reached', icon: Globe },
  { value: '8', label: 'Team Members', icon: Users },
];

const philosophy = [
  {
    title: 'Performance First',
    desc: 'Every millisecond counts. I build with WebAssembly, WebGL, and optimized rendering pipelines to deliver 60fps+ experiences even on modest hardware.',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Accessibility by Default',
    desc: 'Inclusive design isn\'t optional. WCAG AA compliance, reduced motion preferences, semantic HTML, and screen-reader support baked into every component.',
    icon: Target,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Open Source Heart',
    desc: 'Code belongs to the community. Core engines, UI kits, and tools released under MIT. Building in public, learning in public, growing together.',
    icon: Globe,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Craft Over Speed',
    desc: 'No copy-paste solutions. Hand-crafted animations, custom shaders, bespoke interactions. The details users never consciously notice but always feel.',
    icon: Award,
    color: 'from-purple-500 to-pink-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  }),
};

const About = () => {
  return (
    <section className="py-24 px-6 bg-obsidian relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-cyan-600/5" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[200px] rounded-full pointer-events-none"
        style={{ animation: 'float 25s ease-in-out infinite' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.span
            className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block"
            variants={itemVariants}
          >
            About
          </motion.span>
          <motion.h2
            className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-6"
            variants={itemVariants}
          >
            Crafting <span className="gradient-text">Digital Experiences</span>
          </motion.h2>
          <motion.p
            className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl leading-relaxed"
            variants={itemVariants}
          >
            Senior developer specializing in high-performance gaming engines, immersive web experiences,
            and developer tooling. 8+ years pushing browser boundaries.
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="double-bezel p-8 text-center"
              variants={statVariants(i)}
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <motion.div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400"
                whileHover={{ scale: 1.15, rotate: 6 }}
              >
                <stat.icon size={28} />
              </motion.div>
              <motion.div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</motion.div>
              <motion.div className="text-xs uppercase tracking-widest text-gray-500">{stat.label}</motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Philosophy Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {philosophy.map((item, i) => (
            <motion.div
              key={item.title}
              className="relative double-bezel p-8 group"
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: 'rgba(168, 85, 247, 0.5)' }}
            >
              <motion.div
                className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                style={{ transformOrigin: 'left' }}
              />
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-purple-400"
                whileHover={{ scale: 1.1, rotate: 4 }}
              >
                <item.icon size={26} />
              </motion.div>
              <motion.h3
                className="text-xl font-bold uppercase italic tracking-tight mb-3 group-hover:text-purple-400 transition-colors"
              >
                {item.title}
              </motion.h3>
              <motion.p className="text-gray-400 leading-relaxed">
                {item.desc}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.05) translateY(-20px); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default About;