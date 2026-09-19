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
  const cardRefs = useRef([null, null, null, null]);

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
          stagger:  stagger: 0.08,
        }, '-=0.4')
        .from(scrollIndicatorRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
        }, '-=0.2');

      // Floating orbs animation with 3D effect
      orbRefs.current.forEach((orb, i) => {
        if (orb) {
          gsap.to(orb, {
            y: (i - 1) * 100,
            x: (i - 1) * 60,
            rotation: (i - 1) * 8,
            duration: 20 + i * 4,
            ease: 'none',
            repeat: -1,
            yoyo: true,
          });
        }
      });

      // Scroll parallax for orbs with 3D effect
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
                scale: 1 + progress * 0.3,
                opacity: 0.15 - progress * 0.1,
                rotateY: progress * 15,
                rotateX: progress * 10,
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

      // Card stagger animations
      cardRefs.current.forEach((card, index) => {
        if (card) {
          gsap.from(card, {
            opacity: 0,
            y: 100,
            scale: 0.8,
            duration: 1,
            ease: 'back.out(1.7)',
            delay: index * 0.15,
          });
        }
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
      {/* Ambient background orbs with 3D effect */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          ref={orbRefs.current[0]}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/8 to-transparent rounded-full blur-[300px]"
        />
        <div
          ref={orbRefs.current[1]}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-500/8 to-transparent rounded-full blur-[300px]"
        />
        <div
          ref={orbRefs.current[2]}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-600/4 to-cyan-500/4 rounded-full blur-[200px]"
        />
        {/* Subtle 3D grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 0L0 100M0 0L100 100' fill='none' stroke='white' stroke-width='0.3'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-28 items-center">
          {/* Left: Content */}
          <div className="space-y-12">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl glass border border-white/5 hover-lift">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <span className="text-label">Available for elite projects & collaborations</span>
            </div>

            {/* Headline - Editorial Split with 3D effect */}
            <h1
              id="hero-title"
              ref={(el) => { titleLinesRef.current = el?.children || []; }}
              className="text-display-2 italic relative"
              style={{ maxWidth: '100%', wordBreak: 'break-word' }}
            >
              <span className="block animate-fade-up">Crafting</span>
              <span className="block animated-gradient-text animate-fade-up-delay-1">Digital Experiences</span>
              {/* 3D depth effect */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `linear-gradient(45deg, transparent 30%, rgba(168, 85, 247, 0.03) 50%, transparent 70%)`,
                transform: `rotate(-5deg) translate(2px, -2px)`,
                pointerEvents: 'none',
              }} />
            </h1>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="text-body-lg animate-fade-up-delay-2 max-w-[45ch]"
            >
              Senior Game Dev & Web Engineer architecting immersive digital experiences that push the boundaries of what's possible in the browser.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start justify-start gap-6 animate-fade-up-delay-3">
              <button
                ref={ctaPrimaryRef}
                className="magnetic-btn active-press group flex items-center justify-center gap-4 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-purple-600/30 min-w-[200px]"
              >
                View Selected Work
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                ref={ctaSecondaryRef}
                className="magnetic-btn active-press group flex items-center justify-center gap-4 px-10 py-5 glass hover:bg-white/5 rounded-2xl font-bold text-xl transition-all min-w-[200px] border border-white/5"
              >
                <Github size={24} />
                GitHub
              </button>
            </div>

            {/* Stats strip with 3D cards */}
            <div className="flex flex-wrap gap-12 md:gap-16 pt-8 border-t border-white/5 animate-fade-up-delay-4">
              <StatCard value="8+" label="Years Experience" icon="cpu" refIndex={0} />
              <StatCard value="47" label="Projects Shipped" icon="zap" refIndex={1} />
              <StatCard value="12k+" label="Lines of Code/Day" icon="code" refIndex={2} />
            </div>
          </div>

          {/* Right: Visual / Interactive with 3D elements */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main 3D card */}
              <div
                ref={cardRefs.current[0]}
                className="absolute inset-0 double-bezel-3d spotlight-3d hover-lift-3d"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/6 to-cyan-600/6" />
                <TerminalWindow3D />
              </div>
              {/* Floating accent badges with 3D effect */}
              <div
                ref={cardRefs.current[1]}
                className="absolute -bottom-8 -right-8 w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-3xl shadow-purple-500/30 hover-lift-3d animate-fade-up-delay-3"
              >
                <span className="text-3xl font-black">8+</span>
              </div>
              <div
                ref={cardRefs.current[2]}
                className="absolute -top-8 -left-8 w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-3xl shadow-cyan-500/30 hover-lift-3d animate-fade-up-delay-4"
              >
                <span className="text-2xl font-black">47</span>
              </div>
              <div
                ref={cardRefs.current[3]}
                className="absolute bottom-20 right-20 w-36 h-36 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover-lift-3d animate-fade-up-delay-5"
              >
                <span className="text-xl font-black">AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator with 3D effect */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-zinc-500 font-mono text-xs uppercase tracking-widest animate-bounce-subtle"
        >
          <span>Scroll to explore</span>
          <div className="relative w-10 h-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)`,
              transform: `rotate(45deg)`,
            }} />
          </div>
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

const StatCard = ({ value, label, icon, refIndex }) => {
  const iconMap = {
    cpu: <Cpu size={20} />,
    zap: <Zap size={20} />,
    code: <Code2 size={20} />,
    terminal: <Terminal size={20} />,
  };

  return (
    <div ref={(el) => { if (el) cardRefs.current[refIndex] = el; }} className="text-center">
      <div className="flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          {iconMap[icon]}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div>
    </div>
  );
};

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

const TerminalWindow3D = () => (
  <div className="relative h-full w-full rounded-[calc(1.5rem-0.375rem)] bg-zinc-950/70 backdrop-blur-sm flex flex-col overflow-hidden border border-white/4">
    {/* 3D effect container */}
    <div className="absolute inset-0" style={{
      background: `linear-gradient(45deg, transparent 30%, rgba(168, 85, 247, 0.08) 50%, transparent 70%)`,
      transform: `rotate(-3deg) scale(1.02)`,
      pointerEvents: 'none',
    }} />
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