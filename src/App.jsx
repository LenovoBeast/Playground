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

import { SECTION_IDS } from './data/nav.js';
import { useActiveSection, scrollToSection } from './hooks/useActiveSection.js';
import './index.css';

// Pointer-tracking ambient light
function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
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

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

function App() {
  const [active] = useActiveSection(SECTION_IDS);
  const [booting, setBooting] = useState(true);
  const { hash } = useLocation();

  // Deep links like /#projects land on the right section after boot
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const t = setTimeout(() => scrollToSection(id), 900);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div className="noise-overlay relative min-h-screen">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <AnimatePresence>{booting && <Preloader onDone={() => setBooting(false)} />}</AnimatePresence>

      {/* Interactive 3D constellation behind every route */}
      <World activeId={active} />
      <div className="vignette" aria-hidden="true" />
      <CursorGlow />

      <Nav active={active} />

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
                <Games />
                <Contact />
              </main>
              <Footer />
            </>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;