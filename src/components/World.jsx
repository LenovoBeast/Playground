import { useEffect, useRef, useState, useMemo } from 'react';
import { SECTIONS } from '../data/nav.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { scrollToSection } from '../hooks/useActiveSection.js';

export default function World({ activeId = '', enabled = true, paused = false }) {
  const canvasRef = useRef(null);
  const labelRefs = useRef({});
  const engineRef = useRef(null);
  const [interactive, setInteractive] = useState(true);
  // paintLabels reads this inside a rAF loop; a ref keeps the loop stable
  // without re-creating the engine when interactivity toggles on scroll.
  const interactiveRef = useRef(true);
  // Paused while a game overlay is open: the constellation is invisible behind
  // the modal, and letting it render costs the game most of the frame budget.
  const pausedRef = useRef(paused);
  const [hovered, setHovered] = useState(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const nodes = useMemo(
    () => SECTIONS.map((s) => ({ id: s.id, color: s.color })),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Wait for the boot veil to lift: three.js (514 kB) compiling shaders
    // behind the veil starved the boot timers and delayed first interaction.
    if (!enabled) return;

    // three.js is ~500 kB minified — the single heaviest dependency. It is
    // imported here instead of at module scope so it stays out of the entry
    // chunk: the hero paints first, and the constellation boots as its own
    // chunk once the page is interactive.
    let engine = null;
    let raf = 0;
    let running = false;
    let disposed = false;
    let resizeHandler = null;
    let visibilityHandler = null;
    let observer = null;

    (async () => {
      let createBackdrop;
      try {
        ({ createBackdrop } = await import('../three/backdrop.js'));
      } catch (err) {
        console.warn('[world] backdrop chunk failed to load', err);
        return;
      }
      if (disposed) return;

      try {
        engine = createBackdrop(canvas, {
          nodes,
          reducedMotion,
          onHover: setHovered,
          onSelect: (id) => scrollToSection(id),
        });
      } catch (err) {
        // No WebGL (or a context failure): the static aurora layers under the
        // canvas remain, so degrade quietly.
        console.warn('[world] 3D backdrop unavailable', err);
        return;
      }
      if (disposed) {
        engine.dispose();
        return;
      }

      engineRef.current = engine;
      engine.resize();
      setReady(engine.ok);

      let last = performance.now();
      running = true;

      const frame = (now) => {
        if (!running) return;
        if (pausedRef.current) {
          // Yield the frame entirely — no simulation, no label writes.
          last = now;
          raf = requestAnimationFrame(frame);
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const doc = document.documentElement;
        const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
        engine.setScroll(window.scrollY / max);
        engine.update(dt);
        if (engine.ok) paintLabels();
        raf = requestAnimationFrame(frame);
      };

      const paintLabels = () => {
        const projected = engine.project();
        for (const p of projected) {
          const el = labelRefs.current[p.id];
          if (!el) continue;
          const shown = p.visible && interactiveRef.current;
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${p.scale.toFixed(3)})`;
          el.style.opacity = shown ? (p.hovered || p.active ? '1' : '0.72') : '0';
          el.style.pointerEvents = shown ? 'auto' : 'none';
          el.dataset.hovered = p.hovered ? 'true' : 'false';
          el.dataset.active = p.active ? 'true' : 'false';
        }
      };

      raf = requestAnimationFrame(frame);

      resizeHandler = () => engine.resize();
      visibilityHandler = () => {
        if (document.hidden) {
          running = false;
          cancelAnimationFrame(raf);
        } else if (!running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };

      window.addEventListener('resize', resizeHandler);
      document.addEventListener('visibilitychange', visibilityHandler);

      // Pointer input only while hero fills viewport
      const hero = document.getElementById('hero');
      if (hero && typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          (entries) => {
            const ratio = entries[0]?.intersectionRatio ?? 0;
            const on = ratio > 0.45;
            setInteractive(on);
            engine.setInteractive(on);
          },
          { threshold: [0, 0.25, 0.5, 0.75, 1] },
        );
        observer.observe(hero);
      } else {
        engine.setInteractive(false);
        setInteractive(false);
      }
    })();

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resizeHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
      observer?.disconnect();
      engine?.dispose();
      engineRef.current = null;
    };
  }, [nodes, reducedMotion, enabled]);

  useEffect(() => {
    engineRef.current?.setActive(activeId);
  }, [activeId]);

  return (
    <>
      {/* Static ambient field behind the constellation (generated artwork).
          Painted under the canvas — same stacking level, earlier in the DOM —
          so the WebGL layer keeps full interactivity on top. */}
      <div
        className="nexus-field"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}img/gen/hero-ambient.jpg)`,
        }}
      />

      <canvas
        ref={canvasRef}
        id="canvas"
        className="nexus-canvas is-interactive"
        aria-hidden="true"
      />

      {/* Projected labels — accessible mirror of 3D nodes */}
      <div className="pointer-events-none fixed inset-0 z-20">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            ref={(el) => {
              labelRefs.current[section.id] = el;
            }}
            className="nexus-label group flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:text-white"
            style={{ opacity: 0, color: `#${section.color.toString(16).padStart(6, '0')}` }}
            onClick={() => scrollToSection(section.id)}
            tabIndex={interactive && ready ? 0 : -1}
          >
            <span
              className="nexus-label-dot"
              style={{ background: `#${section.color.toString(16).padStart(6, '0')}` }}
            />
            <span className="hidden md:inline whitespace-nowrap">
              {section.index} · {section.label}
            </span>
            <span
              className={`hidden lg:inline whitespace-nowrap text-[10px] normal-case tracking-normal transition-opacity duration-300 ${
                hovered === section.id ? 'opacity-90' : 'opacity-0'
              }`}
            >
              {section.blurb}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}