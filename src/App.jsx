import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import About from './components/About';
import Stack from './components/Stack';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Games from './components/Games';
import World from './components/World';
import Nav from './components/Nav';
import Preloader from './components/Preloader';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Shown where the interactive 3D layers would be if their engine fails:
// the site's static aurora/vignette layers keep working underneath, so the
// fallback is simply "no 3D" rather than an error panel.
const Quiet3DFallback = () => (
  <div className="nexus-canvas-fallback" aria-hidden="true" />
);

import { SECTION_IDS } from './data/nav.js';
import { useActiveSection, scrollToSection } from './hooks/useActiveSection.js';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { useSpotlightTracking } from './hooks/spotlight.js';
import { useClickSparks } from './hooks/clickSparks.js';
import { useSmoothScroll } from './hooks/smoothScroll.js';
import './index.css';

// Pointer-tracking ambient light
function CursorGlow() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Respect the user's motion preference (this layer used to animate
    // regardless) and skip entirely on touch devices.
    if (reducedMotion) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

function App() {
  const [active] = useActiveSection(SECTION_IDS);
  const [booting, setBooting] = useState(true);
  const [gameOpen, setGameOpen] = useState(false);
  const { hash } = useLocation();

  // Page-wide pointer effects: one delegated listener drives the spotlight on
  // every `.spotlight` card, and clicks spawn a few sparks. Both are no-ops
  // under reduced motion / on touch-only devices.
  useSpotlightTracking();
  useClickSparks();

  // Lenis smooth scroll, bridged to ScrollTrigger. No-op under reduced motion.
  useSmoothScroll();

  // Deep links like /#projects land on the right section after boot. Wait for
  // the veil to lift first: scrolling behind a full-screen overlay is wasted
  // work, and the boot's frame loop was delaying the old eager timer.
  useEffect(() => {
    if (!hash || booting) return;
    const id = hash.replace('#', '');
    const t = setTimeout(() => scrollToSection(id), 900);
    return () => clearTimeout(t);
  }, [hash, booting]);

  return (
    <div
      className="noise-overlay relative min-h-screen"
      // While the boot veil is up, the page behind it is inert: keyboard focus
      // and screen-reader navigation can't wander into hidden content.
      {...(booting ? { inert: '' } : {})}
    >
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <AnimatePresence>{booting && <Preloader onDone={() => setBooting(false)} />}</AnimatePresence>

      {/* Interactive 3D constellation behind every route. Isolated: a WebGL or
          engine failure degrades to the static backdrop, never a white screen.
          Boots only after the veil lifts so it can't starve first paint. */}
      <ErrorBoundary label="3D backdrop" fallback={<Quiet3DFallback />}>
        <World activeId={active} enabled={!booting} paused={gameOpen} />
      </ErrorBoundary>
      <div className="vignette" aria-hidden="true" />
      <CursorGlow />

      <Nav active={active} />

      {/* Route content is isolated from the chrome: any render error in a
          section shows a recoverable panel instead of unmounting the app. */}
      <ErrorBoundary label="this page" onReset={() => window.location.reload()}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <main id="main-content">
                <ProjectGrid />
                <About />
                <Stack />
                <Games onOverlayChange={setGameOpen} />
                <Contact />
                </main>
                <Footer />
              </>
            }
          />
          <Route path="*" element={<main id="main-content"><NotFound /></main>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;