import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PaperPlane, Mailbox, GithubLogo, TwitterLogo, LinkedinLogo, MapPin, Clock, CheckCircle, Spinner, Warning, Cpu } from '@phosphor-icons/react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger);

const SOCIAL_ICONS = { github: GithubLogo, twitter: TwitterLogo, linkedin: LinkedinLogo, mail: Mailbox };

const links = [
  { icon: 'github', label: 'GitHub', href: 'https://github.com/LenovoBeast', color: 'group-hover:text-white' },
  { icon: 'twitter', label: 'Twitter', href: 'https://twitter.com/LenovoBeast', color: 'group-hover:text-cyan-400' },
  { icon: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/lenovobeast', color: 'group-hover:text-blue-400' },
  { icon: 'mail', label: 'Email', href: 'mailto:lenovobeast@example.com', color: 'group-hover:text-purple-400' },
];

const availability = [
  { icon: Clock, label: 'Response Time', value: '< 24 hours' },
  { icon: MapPin, label: 'Timezone', value: 'UTC+0 (Flexible)' },
  { icon: Cpu, label: 'Current Focus', value: 'WebGPU, Rust/Wasm, AI Tooling' },
];

export default function Contact() {
  const [formState, setFormState] = useState('idle');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [focused, setFocused] = useState(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const asideRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.children || [], {
        y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: headerRef.current, start: 'top 85%' },
      });
      gsap.from(formRef.current?.children || [], {
        y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: formRef.current, start: 'top 85%' },
      });
      gsap.from(asideRef.current?.children || [], {
        y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: asideRef.current, start: 'top 88%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empty = !formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim();
    const badEmail = formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (empty) {
      const first = document.querySelector('input[name]:not([value])') || formRef.current;
      first?.focus();
      return;
    }
    if (badEmail) {
      const el = formRef.current?.querySelector('input[name="email"]');
      el?.focus();
      return;
    }
    setFormState('submitting');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormState('idle'), 4000);
    } catch (err) {
      setFormState('error');
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section ref={sectionRef} id="contact" className="section-gap relative px-6" data-tracking="contact-section">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-a left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-600/25 to-cyan-500/20" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />
      <div className="section-container relative z-10">
        <div ref={headerRef} className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-6 text-display-2 italic leading-[1.02]">
            Let's Build <span className="gradient-text">Something</span>
          </h2>
          <p className="text-body mx-auto">
            Open to freelance, consulting, and interesting collaborations. Drop a line. I read everything.
          </p>
        </div>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div ref={formRef} className="panel corner-frame relative p-7 md:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-describedby="form-status">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  focused={focused === 'name'}
                  placeholder="Your name"
                  required
                  disabled={formState !== 'idle'}
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  focused={focused === 'email'}
                  placeholder="your@email.com"
                  required
                  disabled={formState !== 'idle'}
                  autoComplete="email"
                />
              </div>
              <Field
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                onFocus={() => setFocused('subject')}
                onBlur={() => setFocused(null)}
                focused={focused === 'subject'}
                placeholder="Project inquiry, collaboration, etc."
                required
                disabled={formState !== 'idle'}
              />
              <div>
                <span className={"block font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 " + (focused === 'message' || formData.message ? 'text-blue-400' : 'text-zinc-500')}>
                  Message <span className="text-blue-400">*</span>
                </span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  placeholder="Tell me about your project..."
                  rows={6}
                  required
                  disabled={formState !== 'idle'}
                  className="mt-3 w-full resize-none rounded-xl border border-white/8 bg-white/[0.035] px-5 py-4 font-mono text-sm text-zinc-200 backdrop-blur-xl transition-all duration-300 placeholder:text-zinc-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1.5 font-mono text-[10px] text-zinc-600">
                  I'll respond within 24 hours
                </p>
              </div>
              <button
                type="submit"
                disabled={formState !== 'idle'}
                className="magnetic-btn btn-sweep active-press relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                {formState === 'submitting' && (
                  <>
                    <Spinner size={20} weight="bold" className="animate-spin" />
                    Sending...
                  </>
                )}
                {formState === 'success' && (
                  <>
                    <CheckCircle size={20} weight="bold" />
                    Sent Successfully
                  </>
                )}
                {formState === 'error' && (
                  <>
                    <Warning size={20} weight="bold" />
                    Failed — Try Again
                  </>
                )}
                {formState === 'idle' && (
                  <>
                    Send Message
                    <PaperPlane size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
            {formState === 'success' && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 animate-fade-up" role="status">
                <CheckCircle size={22} weight="bold" />
                <div>
                  <p className="font-medium">Message sent!</p>
                  <p className="text-sm text-zinc-400">I'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}
            {formState === 'error' && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 animate-fade-up" role="alert">
                <Warning size={22} weight="bold" />
                <div>
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-sm text-zinc-400">Please try again or email directly.</p>
                </div>
              </div>
            )}
          </div>
          <div ref={asideRef} className="space-y-6">
            <div className="panel p-7">
              <h3 className="mb-6 text-display-1 italic">Other Ways to Connect</h3>
              <div className="space-y-3">
                {links.map((link) => {
                  const Icon = SOCIAL_ICONS[link.icon] ?? Mail;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className={`group flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-zinc-400 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:text-white active-press ${link.color}`}
                      aria-label={link.label + ' profile'}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10">
                        <Icon size={18} weight="bold" />
                      </span>
                      <span className="font-medium">{link.label}</span>
                      <span className="ml-auto truncate pl-3 font-mono text-xs text-zinc-600 transition-colors group-hover:text-zinc-400">
                        {link.href.replace('https://', '').replace('mailto:', '')}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="panel p-7">
              <h3 className="mb-6 text-display-1 italic">Availability</h3>
              <div className="space-y-3">
                {availability.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="group flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.02] p-3 transition-colors hover:border-white/12">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">
                      <Icon size={18} weight="bold" className="text-zinc-500 transition-colors group-hover:text-white" />
                    </span>
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Field = ({ label, name, type = 'text', value, onChange, onFocus, onBlur, focused, placeholder, required, disabled, autoComplete }) => {
  const lifted = focused || Boolean(value);
  return (
    <div>
      <label htmlFor={name} className="sr-only">{label}</label>
      <span className={"block font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 " + (lifted ? 'text-blue-400' : 'text-zinc-500')}>
        {label} {required && <span className="text-blue-400" aria-hidden="true">*</span>}
      </span>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="mt-3 w-full rounded-xl border border-white/8 bg-white/[0.035] px-5 py-4 font-mono text-sm text-zinc-200 backdrop-blur-xl transition-all duration-300 placeholder:text-zinc-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};
