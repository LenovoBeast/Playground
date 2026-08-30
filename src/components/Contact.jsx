import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, Mail, Github, Twitter, Linkedin, MapPin, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const [formState, setFormState] = useState('idle'); // idle | submitting | success | error
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        }
      });

      gsap.from(formRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: formRef.current,
          start: 'top 85%',
        }
      });

      gsap.from(linksRef.current?.children || [], {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: linksRef.current,
          start: 'top 85%',
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormState('submitting');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success (in real app, check response)
    setFormState('success');
    setFormData({ name: '', email: '', subject: '', message: '' });

    setTimeout(() => setFormState('idle'), 4000);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const links = [
    { icon: Github, label: 'GitHub', href: 'https://github.com/LenovoBeast', color: 'hover:text-white' },
    { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/LenovoBeast', color: 'hover:text-cyan-400' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/lenovobeast', color: 'hover:text-blue-400' },
    { icon: Mail, label: 'Email', href: 'mailto:lenovobeast@example.com', color: 'hover:text-purple-400' },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="py-24 md:py-32 lg:py-40 px-6 bg-obsidian relative"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-[200px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headerRef} className="mb-16 text-center">
          <span className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block">
            Get In Touch
          </span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-6">
            Let's Build <span className="gradient-text">Something</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed">
            Open to freelance, consulting, and interesting collaborations. Drop a line — I read everything.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div ref={formRef} className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid sm:grid-cols-2 gap-6">
                <InputField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  disabled={formState !== 'idle'}
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={formState !== 'idle'}
                />
              </div>

              <InputField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Project inquiry, collaboration, etc."
                required
                disabled={formState !== 'idle'}
              />

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  rows={6}
                  required
                  disabled={formState !== 'idle'}
                  className="w-full px-5 py-4 glass-strong rounded-2xl resize-none focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={formState !== 'idle'}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all shadow-xl shadow-purple-600/30 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formState === 'submitting' && (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                )}
                {formState === 'success' && (
                  <>
                    <CheckCircle size={20} />
                    Sent Successfully
                  </>
                )}
                {formState === 'error' && (
                  <>
                    <AlertCircle size={20} />
                    Failed — Try Again
                  </>
                )}
                {(formState === 'idle') && (
                  <>
                    Send Message
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {formState === 'success' && (
              <div className="p-4 glass rounded-2xl border border-emerald-500/30 bg-emerald-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle size={24} />
                  <div>
                    <p className="font-medium">Message sent!</p>
                    <p className="text-sm text-gray-400">I'll get back to you within 24 hours.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="glass-strong rounded-3xl p-8">
              <h3 className="text-xl font-black uppercase italic mb-6">Other Ways to Connect</h3>
              <div ref={linksRef} className="space-y-3">
                {links.map((link, i) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 px-4 py-3 glass rounded-2xl transition-all duration-300 group ${link.color} text-gray-300 hover:text-white`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                      <link.icon size={20} />
                    </div>
                    <span className="font-medium">{link.label}</span>
                    <span className="ml-auto text-gray-500 group-hover:text-gray-300 transition-colors font-mono text-xs">
                      {link.href.replace('https://', '').replace('mailto:', '')}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-8">
              <h3 className="text-xl font-black uppercase italic mb-6">Availability</h3>
              <div className="space-y-4">
                <AvailabilityItem icon={Clock} label="Response Time" value="< 24 hours" />
                <AvailabilityItem icon={MapPin} label="Timezone" value="UTC+0 (Flexible)" />
                <AvailabilityItem icon={Cpu} label="Current Focus" value="WebGPU, Rust/Wasm, AI Tooling" />
                <AvailabilityItem icon={Github} label="Open Source" value="Always accepting PRs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const InputField = ({ label, name, type = 'text', value, onChange, placeholder, required, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
      {label} {required && <span className="text-purple-400">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-5 py-4 glass-strong rounded-2xl focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
    />
  </div>
);

const AvailabilityItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 p-3 glass rounded-xl group hover:border-white/10 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
      <Icon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
    </div>
    <div className="flex-1">
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  </div>
);

export default Contact;