import { useState } from 'react';

export default function Footer() {
  const [logoError, setLogoError] = useState(false);
  return (
    <footer className="bg-black text-white/40 py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-2">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="PRODUCTION ISAIAH" 
                className="h-6 md:h-8 w-auto object-contain"
                onError={() => setLogoError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white font-bold tracking-tighter text-xl">
                PRODUCTION <span className="text-amber-500">ISAIAH</span>
              </span>
            )}
            <p className="text-xs">© 2015 Isaiah. All Rights Reserved.</p>
          </div>

          <div className="flex space-x-8 text-xs tracking-widest uppercase">
            <a href="#about" className="hover:text-amber-500 transition-colors">About</a>
            <a href="#work" className="hover:text-amber-500 transition-colors">Work</a>
            <a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-admin'))}
              className="hover:text-amber-500 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
