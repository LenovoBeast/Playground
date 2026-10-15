import React from 'react';

// Catches render-time errors from anything below it: WebGL context failures,
// GSAP timelines targeting dead refs, lazy-chunk load errors. Without a
// boundary, any of those unmounts the whole tree and the visitor gets a
// white screen with no recovery path.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface in dev; a real reporter can hook in here later (no backend).
    console.error('[error-boundary]', this.props.label ?? 'app', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback, label = 'app', onReset } = this.props;
    if (fallback) return fallback;
    return (
      <div role="alert" className="section-gap relative flex min-h-[60vh] items-center justify-center px-6">
        <div className="panel corner-frame relative z-10 max-w-md p-8 text-center">
          <h2 className="mb-3 text-2xl font-black italic tracking-tight">
            Something broke in {label}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-zinc-400">
            The site hit an unexpected error and this section was stopped to
            protect the rest of the page. Reloading usually clears it.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="magnetic-btn btn-sweep active-press inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-950"
            >
              Reload the page
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                Try this section again
              </button>
            )}
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            error code: {String(error.message || error).slice(0, 80)}
          </p>
        </div>
      </div>
    );
  }
}
