import React from 'react';
import { GithubLogo, TwitterLogo, LinkedinLogo, Mailbox, ArrowUp } from '@phosphor-icons/react';
import { scrollToSection } from '../hooks/useActiveSection.js';

const MARQUEE = ['WebGPU', 'Rust / Wasm', 'Three.js', 'React', 'GSAP', 'Playwright', 'Edge Runtime'];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-zinc-950/60 px-6 pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/2 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Ticker */}
      <div className="relative mb-16 overflow-hidden border-y border-white/5 py-5">
        <div className="marquee-inner w-max items-center gap-10 whitespace-nowrap">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex items-center gap-10">
              {MARQUEE.map((item) => (
                <span key={`${pass}-${item}`} className="flex items-center gap-10">
                  <span className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-600">
                    {item}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="section-container relative z-10">
        <div className="grid gap-12 pb-14 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 font-black text-sm text-white">
                LB
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-lg font-black tracking-tight">Lenovo Beast</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  Senior Game Dev & Web Engineer
                </span>
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-500">
              Architecting high-performance engines, immersive web experiences, and developer
              tooling that makes building complex things feel simple.
            </p>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="magnetic-btn btn-sweep active-press relative mt-7 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500"
            >
              Start a project
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600">
                Navigate
              </p>
              <ul className="space-y-2.5">
                {[
                  ['Work', 'projects'],
                  ['About', 'about'],
                  ['Stack', 'stack'],
                  ['Playroom', 'games'],
                  ['Contact', 'contact'],
                ].map(([label, id]) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600">
                Elsewhere
              </p>
              <ul className="space-y-2.5">
                {[
                  ['GitHub', 'https://github.com/LenovoBeast'],
                  ['Twitter', 'https://twitter.com/LenovoBeast'],
                  ['LinkedIn', 'https://linkedin.com/in/lenovobeast'],
                  ['Email', 'mailto:lenovobeast@example.com'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/8 py-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-xs text-zinc-600">
            © {currentYear} Lenovo Beast. Built with React, GSAP, and precision.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/LenovoBeast"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon grid place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white active-press"
              aria-label="GitHub"
            >
              <Github size={17} weight="bold" />
            </a>
            <a
              href="https://twitter.com/LenovoBeast"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon grid place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-cyan-400 active-press"
              aria-label="Twitter"
            >
              <Twitter size={17} weight="bold" />
            </a>
            <a
              href="https://linkedin.com/in/lenovobeast"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon grid place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-blue-400 active-press"
              aria-label="LinkedIn"
            >
              <Linkedin size={17} weight="bold" />
            </a>
            <a
              href="mailto:lenovobeast@example.com"
              className="social-icon grid place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-purple-400 active-press"
              aria-label="Email"
            >
              <Mail size={17} weight="bold" />
            </a>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="footer-icon group grid place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white active-press"
              aria-label="Back to top"
            >
              <ArrowUp size={17} weight="bold" className="transition-transform group-hover:-translate-y-1" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 py-6 text-center text-xs text-zinc-600 md:flex-row md:justify-between md:text-left">
          <p>
            <a href="#main-content" className="underline transition-colors hover:text-white">Privacy Policy</a>
            <span className="mx-2">·</span>
            <a href="#main-content" className="underline transition-colors hover:text-white">Terms of Service</a>
            <span className="mx-2">·</span>
            <a href="#main-content" className="underline transition-colors hover:text-white">Cookie Policy</a>
          </p>
          <p className="font-mono">
            Open source —{' '}
            <a
              href="https://github.com/LenovoBeast/Playground"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-white"
            >
              View source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}