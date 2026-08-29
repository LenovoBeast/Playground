import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import About from './components/About';
import Stack from './components/Stack';
import Contact from './components/Contact';
import NotFound from './components/NotFound';
import './index.css';

function App() {
  return (
    <div className="min-h-screen noise-overlay">
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <ProjectGrid id="projects" />
            <About id="about" />
            <Stack id="stack" />
            <Contact id="contact" />
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;