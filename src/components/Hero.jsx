import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, ChevronRight, Cpu, Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const h1Ref = useRef(null);
  const pRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);
  const orbRefs = useRef([null, null]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.2 } });

      tl.from(h1Ref.current?.children || [], {
        y: 120,
        opacity: 0,
        stagger: 0.12,
        duration: 1.4,
        ease: 'expo.out',
      })
      .from(pRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      }, '-=0.6')
      .from(ctaRef.current?.children || [], {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.4')
      .from(statsRef.current?.children || [], {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.2');

      orbRefs.current.forEach((orb, i) => {
        if (orb) {
          gsap.to(orb, {
            y: i === 0 ? -60 : 60,
            x: i === 0 ? -30 : 30,
            rotation: i === 0 ? -3 : 3,
            duration: 20 + i * 5,
            ease: 'none',
            repeat: -1,
            yoyo: true,
          });
        }
      });

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
                scale: 1 + progress * 0.15,
                opacity: 0.15 - progress * 0.1,
              });
            }
          });
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden noise-overlay"
      style={{ minHeight: '100dvh' }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div
          ref={orbRefs.current[0]}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/15 to-transparent rounded-full blur-[200px] pointer-events-none"
        />
        <div
          ref={orbRefs.current[1]}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-cyan-500/15 to-transparent rounded-full blur-[200px] pointer-events-none"
        />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M80 0H0v80h80V0z' fill='none' stroke='white' stroke-width='0.5'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-10 text-xs font-mono tracking-widest text-cyan-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Available now — v2.0
        </div>

        <h1
          ref={h1Ref}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.03em] leading-[0.92] uppercase italic"
          style={{ maxWidth: '100%', wordBreak: 'break-word' }}
        >
          <span className="block">Crafting</span>
          <span className="block gradient-text">Digital Frontiers</span>
        </h1>

        <p
          ref={pRef}
          className="mt-8 max-w-3xl mx-auto text-gray-300 text-lg md:text-xl leading-relaxed"
        >
          Architecting high-performance gaming experiences and immersive digital tools built for the next generation of the web.
        </p>

        <div
          ref={ctaRef}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-lg transition-all shadow-xl shadow-purple-600/30 group active:scale-[0.98]">
            View Projects
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 glass hover:bg-white/10 rounded-xl font-bold text-lg transition-all active:scale-[0.98]">
            <Cpu size={20} />
            Tech Stack
          </button>
        </div>

        <div
          ref={statsRef}
          className="mt-20 flex flex-wrap justify-center gap-10 md:gap-20 opacity-60"
        >
          <StatItem value="12k+" label="Lines Shipped" />
          <StatItem value="99.9%" label="Uptime" />
          <StatItem value="47" label="Deployed" />
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-black tracking-tight">{value}</div>
    <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">{label}</div>
  </div>
);

export default Hero;