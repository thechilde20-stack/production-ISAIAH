import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Cloud } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import logo from '../assets/logo.png';

const navItems = [
  { name: 'ABOUT', href: '#about' },
  { name: 'SERVICE', href: '#service' },
  { name: 'WORKS', href: '#work' },
  { name: 'PROCESS', href: '#process' },
  { name: 'CONTACT', href: '#contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img 
            src={logo} 
            alt="PRODUCTION ISAIAH" 
            className="h-8 md:h-10 w-auto object-contain"
            onError={(e) => {
              console.error("Logo failed to load:", e);
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-baseline">
                  <span class="text-amber-500 font-extralight tracking-[0.2em] text-xl md:text-2xl uppercase">Production</span>
                  <span class="text-amber-500 font-black tracking-tighter text-2xl md:text-3xl uppercase ml-2">Isaiah</span>
                </div>
              `;
            }}
            referrerPolicy="no-referrer"
          />
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-white/70 hover:text-amber-500 transition-colors tracking-widest"
            >
              {item.name}
            </a>
          ))}
          <a
            href="https://zootv.ezconnect.to/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm font-medium text-white/70 hover:text-amber-500 transition-colors tracking-widest"
          >
            <Cloud className="w-4 h-4" />
            <span>CLOUD</span>
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 py-6 px-6 md:hidden"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-lg font-medium text-white/80 hover:text-amber-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <a
                href="https://zootv.ezconnect.to/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-lg font-medium text-white/80 hover:text-amber-500"
              >
                <Cloud className="w-5 h-5" />
                <span>CLOUD</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
