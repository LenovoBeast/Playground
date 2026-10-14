import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Smooth scroll (Lenis), wired so every scroll consumer on the page keeps
// working:
//
//  - Lenis v1 drives the *native* scroll position, so `window.scrollY` and
//    native `scroll` events still fire. The shared scroll signal
//    (hooks/scrollSignal.js) therefore still feeds the nav hide/show, the
//    progress rail, the section scroll-spy and the 3D backdrop's scroll driver.
//  - GSAP's ticker drives lenis.raf, and lenis' scroll event feeds
//    ScrollTrigger.update, so scroll-linked GSAP animations share one clock.
//  - `autoRaf: false` is required: with it on, Lenis would also advance itself,
//    double-stepping every frame.
//
// Reduced motion opts out entirely — hijacking the scroll is exactly what a
// reader who asked for less motion does not want.
let instance = null;
let lockCount = 0;

export function getLenis() {
  return instance;
}

// Pause/resume smooth scrolling for modal surfaces (mobile drawer, game
// cabinet). These lock the body with `overflow: hidden`, which Lenis ignores
// because it scrolls the window directly, so they must stop it explicitly.
// Counted, so two overlapping locks don't release each other early.
export function setScrollLocked(locked) {
  lockCount = Math.max(0, lockCount + (locked ? 1 : -1));
  if (!instance) return;
  if (lockCount > 0) instance.stop();
  else instance.start();
}

// Back-to-top that goes through Lenis when it is running. A raw
// window.scrollTo would fight Lenis' interpolation and snap past it.
export function scrollToTop() {
  if (instance) {
    instance.scrollTo(0, { duration: 1.1 });
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.1,
      smoothWheel: true,
    });
    instance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Lenis already smooths time; GSAP's lag smoothing would fight it.
    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger measured the page before Lenis existed; re-measure once it
    // is running so trigger positions match the new scroll behaviour.
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      instance = null;
      lockCount = 0;
    };
  }, []);
}
