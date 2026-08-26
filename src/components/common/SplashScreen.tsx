import React, { useState, useEffect } from 'react';
import { Coffee, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number; // default 2400ms (~2.4s)
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  durationMs = 2400 
}) => {
  const [phase, setPhase] = useState<'enter' | 'active' | 'exit' | 'done'>('enter');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Initial active trigger
    const enterTimer = setTimeout(() => setPhase('active'), 50);

    // 2. Smooth elegant progress animation
    const startTime = Date.now();
    const progressDuration = durationMs - 350;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / progressDuration) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 20);

    // 3. Smooth exit dissolve
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, durationMs - 450);

    // 4. Complete unmount
    const finishTimer = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, durationMs);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearInterval(interval);
    };
  }, [durationMs, onComplete]);

  if (phase === 'done') return null;

  const isExiting = phase === 'exit';

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-white via-[#F7FAFA] to-[#EEF5F7] text-[#10222B] overflow-hidden transition-all duration-700 ease-out select-none ${
        isExiting 
          ? 'opacity-0 scale-105 pointer-events-none' 
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Ambient Coastal Fog Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[550px] h-[550px] rounded-full bg-[#1B8585]/10 blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="w-[350px] h-[350px] rounded-full bg-[#3BAFA9]/8 blur-2xl animate-ping" style={{ animationDuration: '5s' }} />
        
        {/* Delicate Fine Gold/Teal Orbital Rings */}
        <div className="absolute w-[340px] h-[340px] rounded-full border border-[#1B8585]/15 animate-spin" style={{ animationDuration: '28s' }} />
        <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-[#D2DFE2] animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
      </div>

      {/* Skip Button in Top Corner */}
      <button
        type="button"
        onClick={() => {
          setPhase('exit');
          setTimeout(() => {
            setPhase('done');
            if (onComplete) onComplete();
          }, 300);
        }}
        className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-[#10222B] text-xs font-semibold shadow-warm-xs border border-[#D2DFE2] transition-all cursor-pointer z-10 hover:shadow-warm-sm"
      >
        Skip &rarr;
      </button>

      {/* Centered Luxury Emblem & Brand Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        
        {/* Floating White Ceramic Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle Ambient Halo */}
          <div className="absolute w-28 h-28 rounded-full bg-[#1B8585]/15 blur-xl animate-pulse" />
          
          <div className="relative w-20 h-20 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xl flex items-center justify-center transform transition-transform duration-500">
            <div className="w-14 h-14 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-xs">
              <Coffee className="w-7 h-7" />
            </div>
          </div>

          {/* Gold Sparkle Accent */}
          <Sparkles className="w-5 h-5 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
        </div>

        {/* Brand Name Typography */}
        <h1 
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[0.3em] uppercase text-[#10222B] mb-2 drop-shadow-xs"
        >
          AURA
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#1B8585] font-bold mb-8">
          Coffee & Kitchen • Coastal Roastery
        </p>

        {/* Sleek Minimalist Loading Line */}
        <div className="w-40 sm:w-48 space-y-2.5">
          <div className="h-1 w-full bg-[#E5ECEE] rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-[#1B8585] via-[#3BAFA9] to-[#10222B] rounded-full transition-all duration-75 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B8585] animate-ping" />
            <span>Handcrafted Extraction</span>
          </div>
        </div>

      </div>

      {/* Subtle Location Tag */}
      <div className="absolute bottom-6 text-[10px] text-stone-400 font-semibold tracking-[0.2em] uppercase">
        Bandra West • Coastal Promenade
      </div>

    </div>
  );
};
