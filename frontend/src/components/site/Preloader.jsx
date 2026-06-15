import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader({ isLoading }) {
  const [show, setShow] = useState(() => {
    const lastPreloader = localStorage.getItem('jkplot_last_preloader');
    if (!lastPreloader) return true;

    // Check if the preloader was shown within the last 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    const now = Date.now();
    if (now - parseInt(lastPreloader, 10) > thirtyMinutes) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (!isLoading && show) {
      // Delay fadeout slightly for a smooth, premium feel
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem('jkplot_last_preloader', Date.now().toString());
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none"
        >
          {/* Decorative ambient background glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

          {/* Animated Branding container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            {/* Pulsing Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-75 animate-pulse" />
            
            {/* Icon/Logo container */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
              JK<span className="text-primary">Plot</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted-foreground/60 font-medium">
              Premium Property Portal
            </p>
          </motion.div>

          {/* Loading Indicator */}
          <div className="absolute bottom-16 flex flex-col items-center gap-3">
            {/* Sleek Progress Bar */}
            <div className="h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="relative h-full w-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <span className="text-[10px] tracking-widest text-muted-foreground/40 uppercase font-semibold">
              Loading Session...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
