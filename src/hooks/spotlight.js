import { useEffect } from 'react';

// One delegated pointer listener for the whole page.
//
// React-Bits-style spotlight cards normally wire a pointermove handler into
// every card. This site already runs a single rAF-batched scroll signal and a
// pointer-tracking cursor glow, so instead of adding N listeners we keep one
// passive listener here and write the pointer position into the hovered
// `.spotlight` element as --spot-x/--spot-y. The CSS radial-gradient does the
// rest (see tailwind.css "Pointer effects").
//
// Skipped on hover-less devices: without a pointer the effect never shows.
export function useSpotlightTracking() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e) => {
      const card = e.target?.closest?.('.spotlight');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}
