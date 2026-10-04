import { useEffect, useRef, useState, useMemo } from 'react';
import { createBackdrop } from '../three/backdrop.js';
import { SECTIONS } from '../data/nav.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { scrollToSection } from '../hooks/useActiveSection.js';

export default function World({ activeId = '' }) {
  const canvasRef = useRef(null);
  const labelRefs = useRef({});
  const engineRef = useRef(null);
  const [interactive, setInteractive] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  const nodes = useMemo(
    () => SECTIONS.map((s) => ({ id: s.id, color: s.color })),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createBackdrop(canvas, {
      nodes,
      reducedMotion,
      onHover: setHovered,
      onSelect: (id) => scrollToSection(id),
    });
    engineRef.current = engine;
    engine.resize();
    setReady(engine.ok);

    let raf = 0;
    let last = performance.now();
    let running = true;

    const frame = (now) => {
      if (!running) return;
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
        const shown = p.visible && interactive;
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${p.scale.toFixed(3)})`;
        el.style.opacity = shown ? (p.hovered || p.active ? '1' : '0.72') : '0';
        el.style.pointerEvents = shown ? 'auto' : 'none';
        el.dataset.hovered = p.hovered ? 'true' : 'false';
        el.dataset.active = p.active ? 'true' : 'false';
      }
    };

    raf = requestAnimationFrame(frame);

    const onResize = () => engine.resize();
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    // Pointer input only while hero fills viewport
    const hero = document.getElementById('hero');
    let io;
    if (hero && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const ratio = entries[0]?.intersectionRatio ?? 0;
          const on = ratio > 0.45;
          setInteractive(on);
          engine.setInteractive(on);
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      io.observe(hero);
    } else {
      engine.setInteractive(false);
      setInteractive(false);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, [nodes, reducedMotion]);

  useEffect(() => {
    engineRef.current?.setActive(activeId);
  }, [activeId]);

  return (
    <>
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