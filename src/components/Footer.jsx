import React from 'react';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 px-6 bg-zinc-950/80 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>

      <div className="section-container relative z-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          {/* Brand / Copyright */}
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <span className="text-display-1 font-black">LB</span>
            </div>
            <p className="text-zinc-500 text-sm font-mono">
              © {currentYear} Lenovo Beast. Built with React, GSAP, and precision.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://github.com/LenovoBeast" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition-colors active-press" aria-label="GitHub">
              <Github size={20} className="text-zinc-400 hover:text-white transition-colors" />
            </a>
            <a href="https://twitter.com/LenovoBeast" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition-colors active-press" aria-label="Twitter">
              <Twitter size={20} className="text-zinc-400 hover:text-cyan-400 transition-colors" />
            </a>
            <a href="https://linkedin.com/in/lenovobeast" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition-colors active-press" aria-label="LinkedIn">
              <Linkedin size={20} className="text-zinc-400 hover:text-blue-400 transition-colors" />
            </a>
            <a href="mailto:lenovobeast@example.com" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition-colors active-press" aria-label="Email">
              <Mail size={20} className="text-zinc-400 hover:text-purple-400 transition-colors" />
            </a>
          </div>

          {/* Back to top */}
          <a href="#main-content" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/5 transition-colors active-press group" aria-label="Back to top">
            <ArrowUpRight size={20} className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 group-hover:translate-y-[-1px] transition-all" />
          </a>
        </div>

        {/* Legal links */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row md:justify-between gap-4 text-center md:text-left">
          <p className="text-zinc-600 text-sm">
            <a href="#" className="hover:text-white transition-colors underline">Privacy Policy</a>
            <span className="mx-2">·</span>
            <a href="#" className="hover:text-white transition-colors underline">Terms of Service</a>
            <span className="mx-2">·</span>
            <a href="#" className="hover:text-white transition-colors underline">Cookie Policy</a>
          </p>
          <p className="text-zinc-600 text-sm font-mono">
            Open source — <a href="https://github.com/LenovoBeast/Playground" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">View source</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;