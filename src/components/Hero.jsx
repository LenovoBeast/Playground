import React, { useState, useEffect } from 'react';
import { Github, Terminal, Cpu, ChevronRight, Menu, X } from 'lucide-react';

const Hero = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 ${
        scrolled ? 'py-4' : 'py-6'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-strong rounded-full px-6 py-3 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Terminal size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tighter uppercase">Nexus<span className="text-purple-500">.</span></span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm font-medium text-gray-400 transition-all duration-300 ${
            mobileMenuOpen ? 'absolute top-full left-6 right-6 md:relative md:absolute md:top-auto md:left-auto md:right-auto flex-col md:flex-row bg-obsidian/95 backdrop-blur-md p-6 md:p-0 rounded-3xl md:rounded-full shadow-2xl border border-white/10' : ''
          }`}>
            {['Projects', 'Builds', 'Stack', 'About'].map((item) => (
              <a key={item} href="#" className="hover:text-white transition-colors md:hover:bg-transparent md:p-0">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
              <Github size={16} /> GitHub
            </button>
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden flex justify-center">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0v60h60V0z' fill='none' stroke='white' stroke-width='0.5'%3E%3C/path%3E%3C/svg%3E")`
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8 text-xs font-mono tracking-widest text-cyan-400 uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Available now: v2.0
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[0.9] mb-8 uppercase italic">
            Crafting <br />
            <span className="gradient-text">
              Digital Frontiers
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
            Architecting high-performance gaming experiences and immersive digital tools
            built for the next generation of the web.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all shadow-xl shadow-purple-600/25 group active:scale-95">
              View Projects
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-xl font-bold transition-all active:scale-95">
              Tech Stack
              <Cpu size={20} />
            </button>
          </div>

          {/* Stats Mockup */}
          <div className="mt-20 flex flex-wrap justify-center gap-12 md:gap-24 opacity-50">
            <div>
              <div className="text-3xl font-bold">12k+</div>
              <div className="text-xs uppercase tracking-widest">Lines Code</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99%</div>
              <div className="text-xs uppercase tracking-widest">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold">45+</div>
              <div className="text-xs uppercase tracking-widest">Deployed</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;