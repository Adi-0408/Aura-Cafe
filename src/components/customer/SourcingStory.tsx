import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Leaf, Flame, HeartHandshake, ArrowRight, Waves } from 'lucide-react';

export const SourcingStory: React.FC = () => {
  const pillars = [
    {
      icon: <Compass className="w-6 h-6 text-[#77C7C6]" />,
      title: 'Direct-Trade Origins',
      description: 'We bypass commercial commodity brokers, paying an average of 42% above Fair Trade minimums directly to generational smallholder farmers across the Pacific Rim, Yirgacheffe, and Huila.'
    },
    {
      icon: <Flame className="w-6 h-6 text-[#77C7C6]" />,
      title: 'Micro-Batch Roasting',
      description: 'Roasting in 12kg precision convection batches on our custom-tuned Loring roaster, retaining delicate jasmine florals and bergamot citrus notes with 80% lower emissions.'
    },
    {
      icon: <Waves className="w-6 h-6 text-[#77C7C6]" />,
      title: 'Slow Cold Drip Mastery',
      description: 'Our signature Kyoto-style slow cold drip towers extract single-origin coffee drop-by-drop over 18 hours, resulting in wine-like sweetness and zero bitterness.'
    }
  ];

  return (
    <section className="py-24 bg-[#0E1D24] text-[#F2F6F7] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#1B8585]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152A35] border border-[#1B8585]/40 text-[#3BAFA9] text-xs font-semibold uppercase tracking-widest">
            <HeartHandshake className="w-3.5 h-3.5" />
            From Coastal Coast to First Sip
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Honoring the Hands Behind Every Pacific Batch
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Great coffee is not manufactured; it is cultivated by master agronomists, nurtured by highland volcanic soils, and unlocked through careful coastal roasting science.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-[#152A35]/80 backdrop-blur-sm p-8 rounded-3xl border border-[#1E3A47] hover:border-[#1B8585]/50 transition-all duration-300 space-y-4 shadow-warm-md group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1E3A47] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {pillar.icon}
              </div>
              <h3 className="font-serif text-2xl font-bold text-white group-hover:text-[#77C7C6] transition-colors">
                {pillar.title}
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Farm Spotlight Banner */}
        <div className="bg-gradient-to-r from-[#152A35] via-[#1E3A47] to-[#152A35] rounded-3xl p-8 sm:p-12 border border-[#1B8585]/30 shadow-warm-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <span className="text-xs uppercase font-bold tracking-widest text-[#77C7C6]">
              Current Farm Microlot Partner
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Finca El Paraíso — Diego Samuel Bermúdez (Cauca, Colombia)
            </h3>
            <p className="text-stone-300 text-sm leading-relaxed">
              Thermal shock washed Castillo variety with notes of passionfruit curd, sparkling elderflower, and dark raw honey. Available in 250g retail whole bean tins.
            </p>
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#1B8585] hover:bg-[#239E9E] text-white font-bold text-sm transition-all duration-200 shadow-warm-md shrink-0"
          >
            <span>Read Our Full Story</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
