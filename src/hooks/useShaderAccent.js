import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

// Mounts the WebGL accent only while its canvas is near the viewport, and tears
// the context down again when it leaves.
//
// The page already runs a full-page constellation and per-game canvases, so a
// permanently-live third context would be competing for the frame budget for
// something the reader cannot see. The shader module is also imported lazily so
// it stays out of the entry chunk.
export function useShaderAccent() {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine = null;
    let pending = false;
    let disposed = false;

    const mount = async () => {
      // `pending` matters: the dynamic import is asynchronous, so without it two
      // quick in-view events both pass the `engine` check and build a second
      // engine on the same canvas. One would then be disposed (losing the WebGL
      // context) while the other kept drawing into it.
      if (engine || pending || disposed) return;
      pending = true;
      let createShaderAccent;
      try {
        ({ createShaderAccent } = await import('../three/shaderAccent.js'));
      } catch (err) {
        console.warn('[shaderAccent] chunk failed to load', err);
        pending = false;
        return;
      }
      pending = false;
      if (disposed || engine) return;
      engine = createShaderAccent(canvas, { reducedMotion });
      if (!engine.ok) {
        engine = null;
        return;
      }
      engine.resize();
      engine.start();
    };

    const unmount = () => {
      engine?.dispose();
      engine = null;
    };

    if (typeof IntersectionObserver === 'undefined') {
      mount();
      return () => {
        disposed = true;
        unmount();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Read the newest entry: a single callback can carry several, and the
        // last one is the current state.
        const latest = entries[entries.length - 1];
        if (latest?.isIntersecting) mount();
        else unmount();
      },
      { rootMargin: '240px' },
    );
    observer.observe(canvas);

    const onResize = () => engine?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      unmount();
    };
  }, [reducedMotion]);

  return canvasRef;
}
