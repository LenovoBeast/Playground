import React from 'react';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import './index.css';

function App() {
  return (
    <div className="min-h-screen noise-overlay">
      <Hero />
      <ProjectGrid />
    </div>
  );
}

export default App;