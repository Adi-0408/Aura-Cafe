import React from 'react';
import { Link } from 'react-router-dom';
import { usePromotion } from '../../context/PromotionContext';
import { Sparkles, Clock, ArrowRight, Zap, Flame } from 'lucide-react';

export const HappyHourBanner: React.FC = () => {
  const { isHappyHourActive, timeRemainingText, settings, isManualOverride } = usePromotion();

  if (!isHappyHourActive) return null;

  return (
    <aside aria-label="Happy hour promotion banner" className="bg-gradient-to-r from-amber-600 via-[#1B8585] to-[#10222B] text-white py-2 px-4 shadow-md border-b border-amber-400/30 animate-fade-in relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        
        {/* Left Side: Headline & Badge */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-bold uppercase tracking-wider text-[10px] border border-white/30 shadow-xs animate-pulse">
            <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Zero-Waste Happy Hour</span>
          </span>

          <p className="font-semibold text-white tracking-wide">
            🥐 <strong className="font-bold underline decoration-amber-300 decoration-2 underline-offset-2">{settings.discountPercent}% OFF</strong> all fresh bakes & artisan kitchen plates!
          </p>
        </div>

        {/* Right Side: Live Countdown & Call to Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-black/40 px-2.5 py-0.5 rounded-full border border-white/20 text-amber-200">
            <Clock className="w-3 h-3 text-amber-300" />
            <span>Ends in <strong>{timeRemainingText}</strong></span>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white text-[#10222B] font-bold text-xs hover:bg-amber-50 hover:text-amber-900 transition-all shadow-xs active:scale-95"
          >
            <span>Explore Bakes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </aside>
  );
};
