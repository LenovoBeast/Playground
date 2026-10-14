import { useEffect } from 'react';

// Click feedback: a handful of short-lived sparks at the pointer, then gone.
//
// Decorative only, so it is skipped entirely for reduced motion and on
// hover-less (touch) devices. The layer is created on demand and removed on
// cleanup, which keeps it out of the React tree and out of the SSR path.
const SPARK_COUNT = 6;

export function useClickSparks() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const layer = document.createElement('div');
    layer.className = 'click-spark-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const onDown = (e) => {
      for (let i = 0; i < SPARK_COUNT; i++) {
        const spark = document.createElement('span');
        spark.className = 'click-spark';
        const angle = (Math.PI * 2 * i) / SPARK_COUNT + Math.random() * 0.6;
        const distance = 18 + Math.random() * 16;
        spark.style.left = `${e.clientX}px`;
        spark.style.top = `${e.clientY}px`;
        spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        // Each spark removes itself, so the layer never accumulates nodes.
        spark.addEventListener('animationend', () => spark.remove(), { once: true });
        layer.appendChild(spark);
      }
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      layer.remove();
    };
  }, []);
}
