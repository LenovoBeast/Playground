import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Github, Twitter, Linkedin, Mail, Send, MessageSquare,
  Code2, Zap, Globe, Users, ArrowRight, Loader2
} from 'lucide-react';

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/LenovoBeast', icon: Github, color: 'hover:text-gray-300' },
  { name: 'Twitter', href: 'https://twitter.com/LenovoBeast', icon: Twitter, color: 'hover:text-cyan-400' },
  { name: 'LinkedIn', href: 'https://linkedin.com/in/lenovobeast', icon: Linkedin, color: 'hover:text-blue-400' },
  { name: 'Email', href: 'mailto:lenovobeast.905@gmail.com', icon: Mail, color: 'hover:text-purple-400' },
];

const contactReasons = [
  { icon: Code2, title: 'Game Dev Collab', desc: 'Co-op projects, engine work, multiplayer systems' },
  { icon: Zap, title: 'Performance Consulting', desc: 'WebGL/WebGPU optimization, WASM, 60fps targets' },
  { icon: Globe, title: 'Open Source', desc: 'Contributions, sponsorship, community building' },
  { icon: Users, title: 'Speaking / Mentoring', desc: 'Conferences, workshops, code reviews' },
];

const formVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const Contact = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setStatus('success');
    setFormState({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
  };

  return (
    <section className="py-24 px-6 bg-obsidian relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-pink-600/5" />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/10 blur-[200px] rounded-full pointer-events-none"
        style={{ animation: 'float 22s ease-in-out infinite reverse' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.span
            className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block"
            variants={itemVariants}
          >
            Contact
          </motion.span>
          <motion.h2
            className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-6"
            variants={itemVariants}
          >
            Let's Build <span className="gradient-text">Something Epic</span>
          </motion.h2>
          <motion.p
            className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl leading-relaxed"
            variants={itemVariants}
          >
            Have a project in mind? Looking for a collaborator? Just want to say hi?
            I read every message personally.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Reasons */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <motion.h3 className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-6">
              What's On Your Mind?
            </motion.h3>
            {contactReasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                className="double-bezel p-6 group relative overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ x: 8, borderColor: 'rgba(168, 85, 247, 0.5)' }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-purple-400"
                  whileHover={{ scale: 1.1, rotate: 4 }}
                >
                  <reason.icon size={22} />
                </motion.div>
                <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                  {reason.title}
                </h4>
                <p className="text-gray-500 text-sm">{reason.desc}</p>
                <motion.div
                  className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  style={{ transformOrigin: 'left' }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h3 className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-6">
              Connect Directly
            </motion.h3>
            {socialLinks.map((social, i) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 double-bezel p-5 group"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ x: 8, borderColor: 'rgba(168, 85, 247, 0.5)', backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors"
                  whileHover={{ scale: 1.15, rotate: 6 }}
                >
                  <social.icon size={22} />
                </motion.div>
                <div className="flex-1">
                  <div className="font-medium text-white">{social.name}</div>
                  <div className="text-gray-500 text-sm truncate">{social.href}</div>
                </div>
                <motion.div
                  className="text-gray-400 group-hover:text-purple-400 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              </motion.a>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="lg:col-span-2"
            variants={formVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div className="relative" variants={fieldVariants}>
                  <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                    Name
                  </label>
                  <motion.input
                    type="text"
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Your name"
                    whileFocus={{ borderColor: 'rgba(168, 85, 247, 1)', boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.1)' }}
                  />
                </motion.div>
                <motion.div className="relative" variants={fieldVariants}>
                  <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                    Email
                  </label>
                  <motion.input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="you@example.com"
                    whileFocus={{ borderColor: 'rgba(168, 85, 247, 1)', boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.1)' }}
                  />
                </motion.div>
              </div>

              <motion.div className="relative" variants={fieldVariants}>
                <label htmlFor="subject" className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                  Subject
                </label>
                <motion.select
                  id="subject"
                  name="subject"
                  value={formState.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
                  whileFocus={{ borderColor: 'rgba(168, 85, 247, 1)', boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.1)' }}
                >
                  <option value="">Select a topic</option>
                  <option value="collab">Game Dev Collaboration</option>
                  <option value="performance">Performance Consulting</option>
                  <option value="opensource">Open Source</option>
                  <option value="speaking">Speaking / Mentoring</option>
                  <option value="other">Other</option>
                </motion.select>
              </motion.div>

              <motion.div className="relative" variants={fieldVariants}>
                <label htmlFor="message" className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                  Message
                </label>
                <motion.textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none font-sans"
                  placeholder="Tell me about your project, idea, or just say hello..."
                  whileFocus={{ borderColor: 'rgba(168, 85, 247, 1)', boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.1)' }}
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white transition-all shadow-xl shadow-purple-600/25 group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : status === 'success' ? (
                  <>
                    <MessageSquare size={20} /> Sent!
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

              <motion.p className="text-center text-gray-500 text-sm">
                No spam. No newsletters. Just a direct line to my inbox.
              </motion.p>
            </form>
          </motion.div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(-50%, 0) scale(1); }
            50% { transform: translate(-50%, 20px) scale(1.03); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default Contact;