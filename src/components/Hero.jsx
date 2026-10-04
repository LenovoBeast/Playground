import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, GithubLogo, Cpu, Lightning, Code, Terminal } from '@phosphor-icons/react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { useTilt } from '../hooks/useTilt.js';
import { scrollToSection } from '../hooks/useActiveSection.js';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const visualRef = useRef(null);
  const badgeRefs = useRef([]);
  const reducedMotion = useReducedMotion();
  const tilt = useTilt({ max: 9, scale: 1.02, lift: 24 });

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from(line1Ref.current, { y: 60, opacity: 0, duration: 1.1 })
        .from(line2Ref.current, { y: 60, opacity: 0, duration: 1.1 }, '-=0.8')
        .from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.9 }, '-=0.6')
        .from(ctaRef.current?.children || [], { y: 28, opacity: 0, duration: 0.8, stagger: 0.09 }, '-=0.5')
        .from(visualRef.current, { y: 80, opacity: 0, rotateY: -12, duration: 1.3 }, '-=1.1')
        .from(badgeRefs.current, { y: 40, opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.7 }, '-=0.8');

      // Scrubbing text reveals on scroll
      gsap.to([line1Ref.current, line2Ref.current], {
        yPercent: -18,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Visual card drift
      gsap.to(visualRef.current, {
        yPercent: -12,
        rotateY: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const iconMap = {
    cpu: <Cpu size={18} weight="bold" />,
    zap: <Lightning size={18} weight="bold" />,
    code: <Code size={18} weight="bold" />,
    terminal: <Terminal size={18} weight="bold" />,
  };

  const StatCard = ({ value, label, icon }) => (
    <div className="group flex items-start gap-3">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-blue-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
        {iconMap[icon]}
      </span>
      <span className="flex flex-col">
        <span className="text-2xl font-black leading-none tracking-tight md:text-3xl tabular-nums">{value}</span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      </span>
    </div>
  );

  const TerminalWindow3D = () => (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.125rem] border border-white/5 bg-zinc-950/75 backdrop-blur-sm">
      {/* Scanning light sweep */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scan-line h-16 w-full bg-gradient-to-b from-transparent via-blue-500/8 to-transparent" />
      </div>

      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900/50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center font-mono text-xs text-zinc-500">main.tsx</div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 sm:inline">live</span>
      </div>

      {/* Terminal content */}
      <div className="no-scrollbar flex-1 overflow-auto p-5 font-mono text-[13px] leading-relaxed text-zinc-300 md:p-6">
        <div className="space-y-2.5">
          <CodeLine prefix="> " content="npm create vite@latest my-game --template react-ts" />
          <CodeLine prefix="✓ " content="Project scaffolded in 247ms" className="text-green-400" />
          <CodeLine prefix="> " content="npm install three @react-three/fiber @react-three/drei" />
          <CodeLine prefix="✓ " content="WebGPU renderer + physics pipeline ready" className="text-cyan-400" />
          <CodeLine prefix="> " content="npm run dev" />
          <CodeLine prefix="▲ " content="Local:   http://localhost:5173" className="text-blue-400" />
          <CodeLine prefix="▲ " content="Network: http://192.168.1.47:5173" className="text-blue-400" />
          <div className="h-4" />
          <CodeLine prefix="// " content="Engine initialized — ready to build" className="italic text-zinc-500" />
          <CodeLine prefix="▌" content="" className="text-blue-400" />
        </div>
      </div>
    </div>
  );

  const CodeLine = ({ prefix, content, className = '' }) => (
    <div className={`flex gap-2 ${className}`}>
      <span className="whitespace-nowrap text-zinc-500">{prefix}</span>
      <span className="break-all">{content}</span>
    </div>
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen items-center px-6 pb-24 pt-32 md:pb-28"
      style={{ minHeight: '100svh' }}
      aria-labelledby="hero-title"
    >
      {/* Content sits above the 3D layer */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Copy - left aligned, offset */}
          <div className="space-y-10 lg:pt-8">
            {/* NO EYEBROW in hero */}

            <h1 id="hero-title" className="pointer-events-auto select-text space-y-4">
              <span ref={line1Ref} className="block text-display-2 italic leading-[0.95] text-balance">
                Crafting
              </span>
              <span ref={line2Ref} className="gradient-text block text-display-2 italic leading-[0.95] text-balance">
                Digital Frontiers
              </span>
            </h1>

            <p ref={subtitleRef} className="pointer-events-auto text-body-lg max-w-[48ch]">
              Senior Game Dev & Web Engineer architecting immersive digital experiences that push browser boundaries.
            </p>

            <div ref={ctaRef} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => scrollToSection('projects')}
                className="magnetic-btn btn-sweep active-press group pointer-events-auto flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500"
              >
                View Work
                <ArrowRight size={22} weight="bold" className="transition-transform group-hover:translate-x-1.5" />
              </button>
              <a
                href="https://github.com/LenovoBeast"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic-btn active-press group pointer-events-auto flex items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-8 py-4 text-lg font-bold backdrop-blur-xl transition-colors hover:bg-white/[0.07]"
              >
                <Github size={22} weight="bold" />
                GitHub
              </a>
            </div>

            <div className="flex flex-wrap gap-10 border-t border-white/8 pt-8 md:gap-14">
              <StatCard value="8+" label="Years Experience" icon="cpu" />
              <StatCard value="47" label="Projects Shipped" icon="zap" />
              <StatCard value="12k+" label="Lines of Code/Day" icon="code" />
            </div>
          </div>

          {/* Visual - right, floating orbital */}
          <div className="relative">
            <div
              ref={visualRef}
              className="tilt-scene pointer-events-auto relative mx-auto aspect-square w-full max-w-md"
              onPointerMove={tilt.onPointerMove}
              onPointerLeave={tilt.onPointerLeave}
            >
              {/* Ambient bloom behind the card */}
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full opacity-70 blur-3xl"
                style={{
                  background: 'conic-gradient(from 120deg, rgba(59,130,246,0.35), rgba(37,99,233,0.25), rgba(168,85,247,0.3), rgba(59,130,246,0.35))',
                }}
              />

              <div ref={tilt.ref} className="tilt-body relative h-full w-full rounded-[1.5rem]">
                <div className="panel corner-frame h-full w-full p-1.5">
                  <TerminalWindow3D />
                </div>
                <div className="tilt-sheen rounded-[1.5rem]" />

                {/* Floating depth badges - orbital elements */}
                <div
                  ref={(el) => { badgeRefs.current[0] = el; }}
                  className="tilt-layer absolute -bottom-6 -right-4 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/30 md:h-28 md:w-28"
                  style={{ transform: 'translateZ(60px)' }}
                >
                  <span className="text-2xl font-black md:text-3xl">8+</span>
                </div>
                <div
                  ref={(el) => { badgeRefs.current[1] = el; }}
                  className="tilt-layer absolute -left-4 -top-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-2xl shadow-cyan-500/30 md:h-24 md:w-24"
                  style={{ transform: 'translateZ(80px)' }}
                >
                  <span className="text-xl font-black md:text-2xl">47</span>
                </div>
                <div
                  ref={(el) => { badgeRefs.current[2] = el; }}
                  className="tilt-layer absolute -right-2 top-1/2 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30"
                  style={{ transform: 'translateZ(45px)' }}
                >
                  <span className="text-sm font-black tracking-widest">AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}