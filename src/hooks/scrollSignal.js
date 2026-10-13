// One rAF-batched scroll signal for the whole page.
//
// Nav's hide/show + progress bar, the section scroll-spy, and the 3D backdrop
// scroll driver each used to attach their own window listener and rAF loop —
// four chains competing on the main thread of an otherwise GPU-heavy page.
// Subscribers now share a single listener and a single frame callback.
const subscribers = new Set();
let raf = 0;
let listening = false;

function onScroll() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const y = window.scrollY;
    for (const fn of subscribers) fn(y);
  });
}

function ensureListening() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

// Calls fn(y) immediately on subscribe, then once per animation frame while
// scrolling. Returns an unsubscribe function.
export function subscribeScroll(fn) {
  subscribers.add(fn);
  ensureListening();
  fn(window.scrollY);
  return () => subscribers.delete(fn);
}
