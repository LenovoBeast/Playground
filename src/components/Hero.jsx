import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  ArrowRight,
  GithubLogo,
  Cpu,
  Lightning,
  Code,
  Terminal,
} from "@phosphor-icons/react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { useTilt } from "../hooks/useTilt.js";
import { scrollToSection } from "../hooks/useActiveSection.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const iconMap = {
  cpu: <Cpu size={18} weight="bold" />,
  zap: <Lightning size={18} weight="bold" />,
  code: <Code size={18} weight="bold" />,
  terminal: <Terminal size={18} weight="bold" />,
};

const StatCard = ({ value, label, icon }) => (
  <div className="group flex items-start gap-3">
    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-zinc-200 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
      {iconMap[icon]}
    </span>
    <span className="flex flex-col">
      <span className="text-2xl font-black leading-none tracking-tight md:text-3xl tabular-nums">
        {value}
      </span>
      <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </span>
    </span>
  </div>
);

const TerminalWindow3D = () => (
  <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.125rem] border border-white/5 bg-zinc-950/75 backdrop-blur-sm">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="scan-line h-16 w-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
    <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-900/50 px-4 py-3">
      <div className="flex gap-1.5">
        <div className="h-3 w-3 rounded-full bg-zinc-500/80" />
        <div className="h-3 w-3 rounded-full bg-zinc-400/80" />
        <div className="h-3 w-3 rounded-full bg-zinc-300/80" />
      </div>
      <div className="flex-1 text-center font-mono text-xs text-zinc-400">
        main.tsx
      </div>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-200 sm:inline">
        live
      </span>
    </div>
    <div className="no-scrollbar flex-1 overflow-auto p-5 font-mono text-[13px] leading-relaxed text-zinc-300 md:p-6">
      <div className="space-y-2.5">
        <CodeLine
          prefix="> "
          content="npm create vite@latest my-game --template react-ts"
        />
        <CodeLine
          prefix="✓ "
          content="Project scaffolded in 247ms"
          className="text-zinc-300"
        />
        <CodeLine
          prefix="> "
          content="npm install three @react-three/fiber @react-three/drei"
        />
        <CodeLine
          prefix="✓ "
          content="WebGPU renderer + physics pipeline ready"
          className="text-zinc-200"
        />
        <CodeLine prefix="> " content="npm run dev" />
        <CodeLine
          prefix="▲ "
          content="Local:   http://localhost:5173"
          className="text-zinc-100"
        />
        <CodeLine
          prefix="▲ "
          content="Network: http://192.168.1.47:5173"
          className="text-zinc-100"
        />
        <div className="h-4" />
        <CodeLine
          prefix="// "
          content="Engine initialized — ready to build"
          className="italic text-zinc-400"
        />
        <CodeLine prefix="▌" content="" className="text-blue-400" />
      </div>
    </div>
  </div>
);

const CodeLine = ({ prefix, content, className = "" }) => (
  <div className={`flex gap-2 ${className}`}>
    <span className="whitespace-nowrap text-zinc-400">{prefix}</span>
    <span className="break-all">{content}</span>
  </div>
);

export default function Hero() {
  const heroRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const visualRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const tilt = useTilt({ max: 9, scale: 1.02, lift: 24 });

  useEffect(() => {
    if (reducedMotion) return;
    const splits = [];
    const ctx = gsap.context(() => {
      // Headline line 1: per-character reveal (GSAP SplitText, free since 3.13).
      // autoSplit re-splits once the self-hosted fonts swap in, so the stagger
      // always matches the final metrics instead of the fallback font's.
      // aria:"hidden" marks the split spans aria-hidden; the <h1> carries the
      // accessible name (aria-label), which is what axe and screen readers use.
      //
      // Only the plain line is split: SplitText nests `position: relative`
      // wrappers, which stops the gradient line's `background-clip: text` from
      // reaching its glyphs (it renders as a blob). The gradient line is
      // revealed whole instead, via a clip-path mask that leaves it untouched.
      if (line1Ref.current) {
        splits.push(
          SplitText.create(line1Ref.current, {
            type: "chars,words",
            autoSplit: true,
            aria: "hidden",
            onSplit: (self) =>
              gsap.from(self.chars, {
                yPercent: 115,
                opacity: 0,
                duration: 0.8,
                ease: "expo.out",
                stagger: { each: 0.02, from: "start" },
              }),
          }),
        );
      }

      gsap.from(line2Ref.current, {
        clipPath: "inset(0% 0% 100% 0%)",
        yPercent: 26,
        duration: 0.9,
        ease: "expo.out",
        delay: 0.1,
      });

      // The rest of the column follows the headline. fromTo (not from): the
      // explicit end state means a tween can never inherit a stale "current"
      // value as its destination if the effect re-runs mid-flight. Timings are
      // deliberately tight so the hero is fully opaque inside ~1s — long fades
      // leave the audit (and the reader) looking at half-transparent text.
      const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.12 });

      tl.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
      )
        .fromTo(
          ctaRef.current?.children || [],
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.07 },
          "-=0.6",
        )
        .fromTo(
          visualRef.current,
          { y: 80, opacity: 0, rotateY: -12 },
          { y: 0, opacity: 1, rotateY: 0, duration: 0.9 },
          "-=1.1",
        );

      gsap.to([line1Ref.current, line2Ref.current], {
        yPercent: -18,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(visualRef.current, {
        yPercent: -12,
        rotateY: 6,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, heroRef);

    return () => {
      ctx.revert();
      // SplitText mutates the DOM, which gsap.context does not undo.
      splits.forEach((split) => split.revert());
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const ctas = Array.from(ctaRef.current?.querySelectorAll("button, a") ?? []);
    const handlers = [];

    ctas.forEach((el) => {
      // Magnetic pull, driven through GSAP rather than CSS: GSAP owns an inline
      // `transform` (and pins `translate: none`) on these buttons for the
      // entrance animation, so a CSS-class transform would be overwritten.
      // quickTo reuses one tween per axis, which keeps pointermove cheap.
      const xTo = gsap.quickTo(el, "x", { duration: 0.3, ease: "power2.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.3, ease: "power2.out" });
      const clamp = gsap.utils.clamp(-7, 7);

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.setProperty("--mx", x + "px");
        el.style.setProperty("--my", y + "px");
        // A touch more travel than before so the pull reads as intentional,
        // still clamped so it stays a nudge and never makes the button flee.
        xTo(clamp(x * 0.2));
        yTo(clamp(y * 0.2));
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      handlers.push([el, onMove, onLeave]);
    });

    return () => {
      handlers.forEach(([el, onMove, onLeave]) => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    };
  }, [reducedMotion]);


  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen items-center px-6 pb-24 pt-32 md:pb-28"
      style={{ minHeight: "100svh" }}
      // Named explicitly rather than via the h1: the About section's heading
      // repeats the same tagline, and two regions sharing a name fails
      // `landmark-unique`. "Introduction" also reads better in a landmark list.
      aria-label="Introduction"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="space-y-10 lg:pt-8">
            <h1
              id="hero-title"
              aria-label="Crafting Digital Frontiers"
              className="pointer-events-auto select-text space-y-4"
            >
              <span
                ref={line1Ref}
                className="block text-display-2 italic leading-[0.95] text-balance"
              >
                Crafting
              </span>
              <span
                ref={line2Ref}
                className="gradient-text block text-display-2 italic leading-[0.95] text-balance"
              >
                Digital Frontiers
              </span>
            </h1>
            <p
              ref={subtitleRef}
              className="pointer-events-auto text-body-lg max-w-[48ch]"
            >
              Senior Game Dev & Web Engineer architecting immersive digital
              experiences that push browser boundaries.
            </p>
            <div
              ref={ctaRef}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={() => scrollToSection("projects")}
                className="magnetic-btn btn-sweep active-press group pointer-events-auto flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
                aria-label="View projects"
              >
                View Work
                <ArrowRight
                  size={22}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1.5"
                />
              </button>
              <a
                href="https://github.com/LenovoBeast"
                target="_blank"
                rel="noopener noreferrer"
                className="magnetic-btn active-press group pointer-events-auto flex items-center justify-center gap-3 rounded-xl border border-white/8 bg-zinc-950/70 px-8 py-4 text-lg font-bold backdrop-blur-xl transition-colors hover:bg-white/[0.07]"
                aria-label="View GitHub profile"
              >
                <GithubLogo size={22} weight="bold" />
                GitHub
              </a>
            </div>
            <div className="flex flex-wrap gap-10 border-t border-white/8 pt-8 md:gap-14">
              <StatCard value="8+" label="Years Experience" icon="cpu" />
              <StatCard value="47" label="Projects Shipped" icon="zap" />
              <StatCard value="12k+" label="Lines of Code/Day" icon="code" />
            </div>
          </div>
          <div className="relative">
            <div
              ref={visualRef}
              className="tilt-scene pointer-events-auto relative mx-auto aspect-square w-full max-w-md"
              onPointerMove={tilt.onPointerMove}
              onPointerLeave={tilt.onPointerLeave}
            >
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    "conic-gradient(from 120deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10), rgba(228,228,231,0.13), rgba(255,255,255,0.16))",
                }}
              />
              <div
                ref={tilt.ref}
                className="tilt-body relative h-full w-full rounded-[1.5rem]"
              >
                <div className="panel corner-frame h-full w-full p-1.5">
                  <TerminalWindow3D />
                </div>
                <div className="tilt-sheen rounded-[1.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
