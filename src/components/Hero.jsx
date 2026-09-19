import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Github, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const titleLinesRef = useRef([]);
  const subtitleRef = useRef(null);
  const ctaPrimaryRef = useRef(null);
  const ctaSecondaryRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const orbRefs = useRef([null, null, null]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial entrance animation
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from(titleLinesRef.current, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
      })
        .from(subtitleRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
        }, '-=0.6')
        .from([ctaPrimaryRef.current, ctaSecondaryRef.current], {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
        }, '-=0.4')
        .from(scrollIndicatorRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
        }, '-=0.2');

      // Floating orbs animation
      orbRefs.current.forEach((orb, i) => {
        if (orb) {
          gsap.to(orb, {
            y: (i - 1) * 80,
            x: (i - 1) * 40,
            rotation: (i - 1) * 5,
            duration: 15 + i * 3,
            ease: 'none',
            repeat: -1,
            yoyo: true,
          });
        }
      });

      // Scroll parallax for orbs
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          orbRefs.current.forEach((orb, i) => {
            if (orb) {
              gsap.set(orb, {
                scale: 1 + progress * 0.2,
                opacity: 0.12 - progress * 0.08,
              });
            }
          });
        },
      });

      // Scroll indicator fade out
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=200',
        scrub: true,
        onUpdate: (self) => {
          if (scrollIndicatorRef.current) {
            gsap.set(scrollIndicatorRef.current, {
              opacity: 1 - self.progress * 2,
            });
          }
        },
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden noise-overlay section-container"
      style={{ minHeight: '100dvh' }}
      aria-labelledby="hero-title"
    >
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          ref={orbRefs.current[0]}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[200px]"
        />
        <div
          ref={orbRefs.current[1]}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-[200px]"
        />
        <div
          ref={orbRefs.current[2]}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-purple-600/5 to-cyan-500/5 rounded-full blur-[150px]"
        />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0v60h60V0z' fill='none' stroke='white' stroke-width='0.5'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div className="space-y-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-label">Available for freelance & consulting</span>
            </div>

            {/* Headline - Editorial Split */}
            <h1
              id="hero-title"
              ref={(el) => { titleLinesRef.current = el?.children || []; }}
              className="text-display-3 italic"
              style={{ maxWidth: '100%', wordBreak: 'break-word' }}
            >
              <span className="block animate-fade-up">Crafting</span>
              <span className="block animated-gradient-text animate-fade-up-delay-1">Digital Frontiers</span>
            </h1>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="text-body animate-fade-up-delay-2"
            >
              Senior Game Dev & Web Engineer architecting high-performance gaming engines, immersive web experiences, and developer tooling that makes building complex things feel simple.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start justify-start gap-4 animate-fade-up-delay-3">
              <button
                ref={ctaPrimaryRef}
                className="magnetic-btn active-press group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all shadow-xl shadow-purple-600/30 min-w-[180px]"
              >
                View Selected Work
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                ref={ctaSecondaryRef}
                className="magnetic-btn active-press group flex items-center justify-center gap-3 px-8 py-4 glass hover:bg-white/5 rounded-xl font-bold text-lg transition-all min-w-[180px] border border-white/5"
              >
                <Github size={20} />
                GitHub
              </button>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-10 md:gap-16 pt-6 border-t border-white/5 animate-fade-up-delay-4">
              <StatItem value="8+" label="Years Experience" />
              <StatItem value="47" label="Projects Shipped" />
              <StatItem value="12k+" label="Lines of Code/Day" />
            </div>
          </div>

          {/* Right: Visual / Interactive */}
          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Interactive terminal-style card */}
              <div className="absolute inset-0 double-bezel spotlight">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-cyan-600/5" />
                <TerminalWindow />
              </div>
              {/* Floating accent badges */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-fade-up-delay-3">
                <span className="text-2xl font-black">8+</span>
              </div>
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-fade-up-delay-4">
                <span className="text-xl font-black">47</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-zinc-500 font-mono text-xs uppercase tracking-widest animate-bounce-subtle"
        >
          <span>Scroll to explore</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-black tracking-tight">{value}</div>
    <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{label}</div>
  </div>
);

const TerminalWindow = () => (
  <div className="relative h-full w-full rounded-[calc(1.5rem-0.375rem)] bg-zinc-950/80 backdrop-blur-sm flex flex-col overflow-hidden border border-white/5">
    {/* Terminal header */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-zinc-900/50">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <div className="flex-1 text-center text-xs font-mono text-zinc-500">main.tsx</div>
    </div>

    {/* Terminal content */}
    <div className="flex-1 p-6 font-mono text-sm text-zinc-300 leading-relaxed overflow-auto">
      <div className="space-y-3">
        <CodeLine prefix="> " content="npm create vite@latest my-game --template react-ts" />
        <CodeLine prefix="✓ " content="Project scaffolded in 247ms" className="text-green-400" />
        <CodeLine prefix="> " content="npm install three @react-three/fiber @react-three/drei" />
        <CodeLine prefix="✓ " content="WebGPU renderer + physics pipeline ready" className="text-cyan-400" />
        <CodeLine prefix="> " content="npm run dev" />
        <CodeLine prefix="▲ " content="Local:   http://localhost:5173" className="text-purple-400" />
        <CodeLine prefix="▲ " content="Network: http://192.168.1.47:5173" className="text-purple-400" />
        <div className="h-4" />
        <CodeLine prefix="// " content="Engine initialized — ready to build" className="text-zinc-500 italic" />
      </div>
    </div>
  </div>
);

const CodeLine = ({ prefix, content, className = '' }) => (
  <div className={`flex gap-2 ${className}`}>
    <span className="text-zinc-500 whitespace-nowrap">{prefix}</span>
    <span>{content}</span>
  </div>
);

export default Hero;