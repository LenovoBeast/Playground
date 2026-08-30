import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Github, Linkedin, Twitter, Mail, MapPin, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 85%',
        }
      });

      gsap.from(imageRef.current?.children || [], {
        x: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top 85%',
        }
      });

      const stats = statsRef.current?.children || [];
      gsap.from(stats, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const timeline = [
    { year: "2024", title: "Senior Game Dev & Web Engineer", company: "Freelance / Open Source", desc: "Architecting high-performance engines, immersive web experiences, and developer tooling." },
    { year: "2022", title: "Lead Frontend Engineer", company: "Tech Startup", desc: "Built design systems, scaled React architecture, mentored 5 engineers." },
    { year: "2020", title: "Game Developer", company: "Game Studio", desc: "Shipped 3 commercial titles. Engine development, rendering pipelines, multiplayer networking." },
    { year: "2018", title: "Full Stack Developer", company: "Digital Agency", desc: "End-to-end web apps, CMS architecture, performance optimization." },
  ];

  const stats = [
    { value: "8+", label: "Years Experience" },
    { value: "47", label: "Projects Shipped" },
    { value: "12k+", label: "Lines of Code/Day" },
    { value: "24/7", label: "Always Building" },
  ];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-24 md:py-32 lg:py-40 px-6 bg-obsidian relative overflow-hidden"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div ref={textRef} className="space-y-10">
            <span className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm block">
              About Me
            </span>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
              Crafting <br />
              <span className="gradient-text">Digital Frontiers</span>
            </h2>

            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-6">
              <p>
                I'm a senior developer with 8+ years pushing browser boundaries. My focus: high-performance
                gaming engines, immersive web experiences, and developer tooling that makes building
                complex things feel simple.
              </p>
              <p>
                Started with Flash/ActionScript, evolved through jQuery, Backbone, Angular, React, and
                now WebGPU/Wasm. The stack changes. The craft — clean architecture, performance obsession,
                delightful UX — stays constant.
              </p>
              <p>
                Currently exploring: WebGPU compute shaders, Rust/Wasm for game logic, local-first software,
                and AI-augmented development workflows.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
              <a href="https://github.com/LenovoBeast" className="flex items-center gap-2 px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                <Github size={18} /> GitHub
              </a>
              <a href="https://twitter.com/LenovoBeast" className="flex items-center gap-2 px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                <Twitter size={18} /> Twitter
              </a>
              <a href="https://linkedin.com/in/lenovobeast" className="flex items-center gap-2 px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                <Linkedin size={18} /> LinkedIn
              </a>
              <a href="mailto:lenovobeast@example.com" className="flex items-center gap-2 px-5 py-2.5 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                <Mail size={18} /> Email
              </a>
            </div>
          </div>

          <div className="space-y-8">
            <div ref={imageRef} className="relative">
              <div className="double-bezel p-1.5 aspect-square">
                <div className="aspect-square rounded-[calc(2rem-0.375rem)] bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-50" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 0H0v100h100V0z' fill='none' stroke='white' stroke-width='0.5'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundSize: '100px 100px',
                  }} />
                  <Terminal size={64} className="text-purple-400/50 relative z-10" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <span className="text-2xl font-black">8+</span>
              </div>
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <span className="text-xl font-black">47</span>
              </div>
            </div>

            <div ref={statsRef} className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 glass rounded-2xl group hover:border-white/20 transition-colors">
                  <div className="text-3xl md:text-4xl font-black tracking-tight">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h3 className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-8">
            Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-transparent to-cyan-500/50" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={i} className="relative pl-20 group">
                  <div className="absolute left-0 top-1 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group:hover:scale-110 transition-transform duration-300 z-10">
                    <span className="text-sm font-black">{item.year}</span>
                  </div>
                  <div className="glass p-6 rounded-2xl group-hover:border-white/20 transition-colors">
                    <h4 className="text-xl font-black uppercase italic mb-2">{item.title}</h4>
                    <p className="text-cyan-400 font-mono text-sm mb-3">{item.company}</p>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;