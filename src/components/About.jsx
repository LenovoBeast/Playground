import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Terminal,
  GithubLogo,
  LinkedinLogo,
  TwitterLogo,
  Mailbox,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { useReducedMotion, useInView } from "../hooks/useReducedMotion.js";
import { SOCIALS } from "../data/nav.js";

gsap.registerPlugin(ScrollTrigger);

const SOCIAL_ICONS = {
  github: GithubLogo,
  twitter: TwitterLogo,
  linkedin: LinkedinLogo,
  mail: Mailbox,
};

const timeline = [
  {
    year: "2024",
    title: "Senior Game Dev & Web Engineer",
    company: "Freelance / Open Source",
    desc: "Architecting high-performance engines, immersive web experiences, and developer tooling.",
  },
  {
    year: "2022",
    title: "Lead Frontend Engineer",
    company: "Tech Startup",
    desc: "Built design systems, scaled React architecture, mentored 5 engineers.",
  },
  {
    year: "2020",
    title: "Game Developer",
    company: "Game Studio",
    desc: "Shipped 3 commercial titles. Engine development, rendering pipelines, multiplayer networking.",
  },
  {
    year: "2018",
    title: "Full Stack Developer",
    company: "Digital Agency",
    desc: "End-to-end web apps, CMS architecture, performance optimization.",
  },
];

const stats = [
  { value: "8+", label: "Years Experience" },
  { value: "47", label: "Projects Shipped" },
  { value: "12k+", label: "Lines of Code Daily" },
  { value: "24/7", label: "Always Building" },
];

export default function About() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const visualRef = useRef(null);
  const statsRef = useRef(null);
  const timelineRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const statsInView = useInView(statsRef);

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.children || [], {
        y: 44,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: textRef.current, start: "top 82%" },
      });
      gsap.from(visualRef.current, {
        x: 60,
        opacity: 0,
        rotateY: -10,
        duration: 1.3,
        ease: "expo.out",
        scrollTrigger: { trigger: visualRef.current, start: "top 82%" },
      });
      gsap.from(statsRef.current?.children || [], {
        y: 34,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: statsRef.current, start: "top 88%" },
      });
      gsap.from(timelineRef.current?.children || [], {
        x: 46,
        opacity: 0,
        duration: 0.85,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: timelineRef.current, start: "top 85%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section-gap relative overflow-hidden px-6"
      data-tracking="about-section"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-a left-[-10%] top-[8%] h-[420px] w-[420px] bg-blue-600/20" />
        <div className="aurora aurora-b right-[-8%] top-[42%] h-[380px] w-[380px] bg-cyan-500/15" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />
      <div className="section-container relative z-10">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
          <div ref={textRef} className="space-y-10">
            <span className="block text-label">About Me</span>
            <h2 className="text-display-2 italic leading-[1.02]">
              Crafting <br />
              <span className="gradient-text">Digital Frontiers</span>
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-zinc-400 md:text-lg">
              <p>
                I'm a senior developer with 8+ years pushing browser boundaries.
                My focus: high-performance gaming engines, immersive web
                experiences, and developer tooling that makes building complex
                things feel simple.
              </p>
              <p>
                Started with Flash/ActionScript, evolved through jQuery,
                Backbone, Angular, React, and now WebGPU/Wasm. The stack
                changes. The craft — clean architecture, performance obsession,
                delightful UX — stays constant.
              </p>
              <p>
                Currently exploring: WebGPU compute shaders, Rust/Wasm for game
                logic, local-first software, and AI-augmented development
                workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-white/8 pt-8">
              {SOCIALS.map(({ icon, label, href }) => {
                const Icon = SOCIAL_ICONS[icon] ?? Mailbox;
                return (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={
                      href.startsWith("mailto:")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="group flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07] hover:text-white active-press"
                    aria-label={label + " profile"}
                  >
                    <Icon size={16} weight="bold" />
                    {label}
                    <ArrowUpRight
                      size={13}
                      weight="bold"
                      className="opacity-0 transition-opacity duration-300 group-hover:opacity-70"
                    />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="space-y-8">
            <div ref={visualRef} className="relative">
              <div className="panel corner-frame relative aspect-square overflow-hidden p-2">
                <div className="grid-veil relative grid h-full w-full place-items-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-blue-600/10 to-cyan-600/10">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center"
                  >
                    <span className="animate-spin-slow absolute h-[62%] w-[62%] rounded-full border border-dashed border-blue-400/25" />
                    <span className="animate-spin-slower absolute h-[82%] w-[82%] rounded-full border border-cyan-400/20" />
                    <span className="absolute h-[42%] w-[42%] rounded-full bg-blue-500/10 blur-2xl" />
                  </div>
                  <div className="relative grid place-items-center">
                    <span className="absolute h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />
                    <Terminal
                      size={72}
                      weight="bold"
                      className="relative text-blue-300/70"
                    />
                  </div>
                  <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    operator // lb
                  </span>
                  <span className="absolute right-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                    online
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-5 grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/30 md:h-28 md:w-28">
                <span className="text-2xl font-black md:text-3xl">8+</span>
              </div>
              <div className="absolute -left-5 -top-6 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-2xl shadow-cyan-500/30 md:h-24 md:w-24">
                <span className="text-xl font-black md:text-2xl">47</span>
              </div>
            </div>
            <div
              ref={statsRef}
              className="grid grid-cols-2 gap-4 border-t border-white/8 pt-8"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="panel group p-5 transition-colors hover:border-white/15"
                >
                  <div className="text-3xl font-black tracking-tight md:text-4xl">
                    <Counter value={stat.value} active={statsInView} />
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-24">
          <div className="mb-10 flex items-center gap-4">
            <span className="text-label">Timeline</span>
            <span className="hairline flex-1" />
          </div>
          <div className="relative">
            <div className="spine absolute bottom-0 left-8 top-0 w-px opacity-60" />
            <div ref={timelineRef} className="space-y-10">
              {timeline.map((item) => (
                <div key={item.year} className="group relative pl-20">
                  <span className="absolute left-0 top-1 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 transition-transform duration-500 group-hover:scale-110">
                    <span className="text-sm font-black">{item.year}</span>
                  </span>
                  <span className="absolute left-[31px] top-1/2 hidden h-px w-8 bg-gradient-to-r from-blue-500/40 to-transparent md:block" />
                  <div className="panel p-6 transition-colors group-hover:border-white/18">
                    <h4 className="mb-2 text-xl font-black uppercase italic tracking-tight">
                      {item.title}
                    </h4>
                    <p className="mb-3 font-mono text-sm text-cyan-400">
                      {item.company}
                    </p>
                    <p className="leading-relaxed text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({ value, active }) {
  const raw = String(value);
  const match = raw.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : raw;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  if (!match) return <span>{value}</span>;
  return (
    <span className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
