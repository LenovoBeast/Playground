import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import About from './components/About';
import Stack from './components/Stack';
import Contact from './components/Contact';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import './index.css';

function App() {
  return (
    <div className="min-h-screen noise-overlay relative">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <main id="main-content">
              <ProjectGrid id="projects" />
              <About id="about" />
              <Stack id="stack" />
              <Contact id="contact" />
            </main>
            <Footer />
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;