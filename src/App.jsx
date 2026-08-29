import React from 'react';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import About from './components/About';
import Stack from './components/Stack';
import Contact from './components/Contact';
import './index.css';

function App() {
  return (
    <div className="min-h-screen noise-overlay">
      <Hero />
      <ProjectGrid />
      <About />
      <Stack />
      <Contact />
    </div>
  );
}

export default App;