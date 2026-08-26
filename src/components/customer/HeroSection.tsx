import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, Sparkles, Award, HeartHandshake, Waves } from 'lucide-react';
import { getCafeLiveStatus } from '../../utils/date';

export const HeroSection: React.FC = () => {
  const liveStatus = getCafeLiveStatus();

  return (
    <section className="relative overflow-hidden bg-[#F2F6F7] pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#D2DFE2]">
      {/* Subtle coastal Pacific fog background glow */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-[#1B8585]/15 to-[#3BAFA9]/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-20" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#1E3A47]/10 to-transparent rounded-full blur-3xl pointer-events-none -ml-40 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Story & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#D2DFE2] shadow-warm-sm text-xs font-medium text-[#1E3A47]">
              <span className={`w-2 h-2 rounded-full ${liveStatus.isOpen ? 'bg-[#3BAFA9] animate-ping' : 'bg-rose-500'}`} />
              <span className="font-semibold text-[#10222B]">{liveStatus.statusText}</span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-600">{liveStatus.nextTransition}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#10222B] leading-[1.12]">
              Pacific Drip Craft. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B8585] via-[#2B6F7A] to-[#10222B]">
                Ocean Fog Bakery.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Welcome to <strong>Aura Coffee & Kitchen</strong>. A coastal sanctuary where direct-trade Pacific microlots and cold brews are dialed to perfection and paired with wild-fermented sourdough viennoiserie.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#10222B] text-[#F2F6F7] font-semibold text-sm hover:bg-[#1E3A47] active:scale-98 transition-all shadow-warm-md hover:shadow-warm-lg"
              >
                <span>Explore Coastal Menu</span>
                <ArrowRight className="w-4 h-4 text-[#77C7C6]" />
              </Link>

              <Link
                to="/reservations"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#10222B] font-semibold text-sm border border-[#D2DFE2] hover:bg-[#EEF4F6] hover:border-[#1B8585]/50 active:scale-98 transition-all shadow-warm-sm"
              >
                <CalendarDays className="w-4 h-4 text-[#1B8585]" />
                <span>Reserve a Table</span>
              </Link>
            </div>

            {/* Key Trust Signals / Craft Highlights */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#D2DFE2]/80 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B8585]">
                  <Award className="w-4 h-4 text-[#3BAFA9]" />
                  <span>88+ SCA</span>
                </div>
                <p className="text-xs text-stone-600">Specialty Grade 1 Single-Origin Microlots</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B8585]">
                  <Waves className="w-4 h-4 text-[#3BAFA9]" />
                  <span>Cold Brewed</span>
                </div>
                <p className="text-xs text-stone-600">18-hour slow drip extraction over Japanese mineral ice</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B8585]">
                  <HeartHandshake className="w-4 h-4 text-[#3BAFA9]" />
                  <span>Direct Trade</span>
                </div>
                <p className="text-xs text-stone-600">100% transparent pricing paid directly to smallholder farms</p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Artisan Visual Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-warm-xl border-4 border-white aspect-[4/5] bg-stone-900 group">
                <img
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85"
                  alt="Aura Coffee Barista Pouring Specialty Latte Art"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081318]/85 via-[#081318]/20 to-transparent" />
                
                {/* Floating caption on image */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#1B8585] text-[10px] font-bold tracking-widest uppercase text-white mb-1">
                    Morning Feature
                  </span>
                  <h3 className="font-serif text-xl font-bold">Pacific Coast Cortado & Sea-Salt Croissant</h3>
                  <p className="text-xs text-stone-300">Extracted fresh on our custom low-emission Slayer machine.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
