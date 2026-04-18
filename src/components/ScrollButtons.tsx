import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      // All buttons stay hidden until scrolled down 400px
      const isNearTop = scrollY < 400;
      
      // Show top button after scrolling down 400px
      setShowTop(!isNearTop);
      
      // Show bottom button only after 400px descent AND if not near the very bottom
      setShowBottom(!isNearTop && scrollY + windowHeight < fullHeight - 400);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col space-y-2">
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className={cn(
              "w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 ",
              "flex items-center justify-center text-white/50 hover:text-amber-500 hover:border-amber-500/50 ",
              "transition-all duration-300 shadow-2xl"
            )}
            title="Scroll to Top"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            onClick={scrollToBottom}
            className={cn(
              "w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 ",
              "flex items-center justify-center text-white/50 hover:text-amber-500 hover:border-amber-500/50 ",
              "transition-all duration-300 shadow-2xl"
            )}
            title="Scroll to Bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
