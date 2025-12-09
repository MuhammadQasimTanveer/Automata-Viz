import React from 'react';
import { useEffect } from 'react'
import initLenis from './lib/lenis'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Converter } from './pages/Converter';

function App() {

   useEffect(() => {
    const lenis = initLenis();
    return () => lenis.destroy();
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Converter />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;