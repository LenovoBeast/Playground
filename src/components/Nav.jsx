import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Hamburger, GithubLogo, ArrowUpRight, Compass } from '@phosphor-icons/react';
import { SECTIONS } from '../data/nav.js';
import { scrollToSection } from '../hooks/useActiveSection.js';
import { subscribeScroll } from '../hooks/scrollSignal.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { setScrollLocked, scrollToTop } from '../hooks/smoothScroll.js';

export default function Nav({ active }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const progressRef = useRef(null);
  const lastY = useRef(0);
  const drawerPanelRef = useRef(null);

  // Trap Tab focus inside the open drawer and restore it to the toggle on
  // close; Escape also closes (same contract as the game overlay).
  useFocusTrap(drawerPanelRef, open, { onEscape: () => setOpen(false) });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = (y) => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      if (progressRef.current && !prefersReduced) {
        progressRef.current.style.transform = `scaleX(${Math.min(y / max, 1)})`;
      }
      setScrolled(y > 24);
      const delta = y - lastY.current;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 320);
        lastY.current = y;
      }
    };
    // Shared scroll signal — see hooks/scrollSignal.js
    return subscribeScroll(measure);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    // Lenis scrolls the window directly, so the body lock alone would not stop
    // the page scrolling behind the drawer.
    setScrollLocked(open);
    return () => {
      document.body.style.overflow = '';
      setScrollLocked(false);
    };
  }, [open]);

  const go = (id) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <>
      <div className="progress-rail" aria-hidden="true">
        <div ref={progressRef} className="progress-bar" />
      </div>

      <header
        className={`nav-pill transition-transform duration-500 ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className={`nav-container ${scrolled ? 'max-w-[calc(100%-3rem)]' : ''}`}>
          {/* Monogram */}
          <button
            type="button"
            onClick={scrollToTop}
            className="group flex items-center gap-3 active-press flex-shrink-0"
            aria-label="Back to top"
          >
            <span className="relative grid h-9 w-9 place-items-center">
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white to-zinc-300 opacity-70 blur-[6px] transition-opacity group-hover:opacity-100" />
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-white to-zinc-300 font-black text-[13px] text-zinc-950">
                LB
              </span>
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-black tracking-tight">Lenovo Beast</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">Game Dev & Web Engineer</span>
            </span>
          </button>

          {/* Desktop links */}
          <nav aria-label="Primary" className="hidden lg:flex items-center">
            <ul className="flex items-center gap-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => go(section.id)}
                    data-active={active === section.id ? 'true' : undefined}
                    className="nav-link"
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://github.com/LenovoBeast"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white active-press sm:flex"
              aria-label="GitHub profile"
            >
              <GithubLogo size={17} weight="bold" />
            </a>

            <button
              type="button"
              onClick={() => go('contact')}
              className="magnetic-btn btn-sweep active-press relative hidden items-center gap-2 overflow-hidden rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-200 sm:flex"
            >
              Start a project
              <ArrowUpRight size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.07] lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-drawer"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={18} weight="bold" /> : <Hamburger size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-drawer"
            className="mobile-drawer active fixed inset-0 z-[85] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div className="backdrop" onClick={() => setOpen(false)} />
            <motion.nav
              ref={drawerPanelRef}
              aria-label="Mobile"
              className="panel mx-auto mt-24 flex-1 flex-col items-center justify-center gap-4 p-8"
              initial={{ y: -24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="space-y-2">
                {SECTIONS.map((section, i) => (
                  <motion.li
                    key={section.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
                  >
                    <button
                      type="button"
                      onClick={() => go(section.id)}
                      data-active={active === section.id}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-4 text-left transition-colors ${
                        active === section.id
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] text-zinc-400">{section.index}</span>
                        <span className="text-lg font-bold tracking-tight">{section.label}</span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        {section.blurb}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-6 w-full">
                <button
                  type="button"
                  onClick={() => go('contact')}
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 active-press"
                >
                  Start a project
                </button>
                <button
                  type="button"
                  onClick={() => go('hero')}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-300 active-press"
                  aria-label="Back to top"
                >
                  <Compass size={18} weight="bold" />
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}