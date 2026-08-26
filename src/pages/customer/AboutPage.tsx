import React from 'react';
import { Compass, Flame, Leaf, HeartHandshake, Award, Coffee, Sparkles, Waves } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const originPartners = [
    {
      country: 'Ethiopia (Yirgacheffe)',
      farm: 'Idido Cooperative & Smallholder Families',
      altitude: '2,050 – 2,200 MASL',
      variety: 'Heirloom Ethiopian Kurume',
      process: 'Natural Raised African Bed Dry',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
      flavor: 'Wild Bergamot, Jasmine Flower, Candied Blueberry'
    },
    {
      country: 'Colombia (Huila)',
      farm: 'Finca El Paraíso — Diego Samuel Bermúdez',
      altitude: '1,930 MASL',
      variety: 'Castillo & Pink Bourbon',
      process: 'Thermal Shock Anaerobic Washed',
      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80',
      flavor: 'Passionfruit Curd, White Peach, Elderflower'
    },
    {
      country: 'Guatemala (Antigua)',
      farm: 'Finca Medina Organic Estate',
      altitude: '1,650 MASL',
      variety: 'Red & Yellow Caturra',
      process: 'Volcanic Spring Water Washed',
      image: 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?auto=format&fit=crop&w=600&q=80',
      flavor: 'Brown Butter Caramel, Roasted Macadamia, Dark Chocolate'
    }
  ];

  return (
    <div className="py-16 bg-[#F6F9FA] space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            Pacific Origins & Craft
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#10222B] tracking-tight">
            The Pursuit of Coastal Clarity & Slow Cold Fermentation
          </h1>
          <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
            Founded along the misty Pacific coastline, Aura Coffee & Kitchen was born from a singular conviction: that coffee is an agricultural fruit whose delicate terroir should be celebrated with Scandinavian clarity and coastal warmth.
          </p>
        </div>

        {/* Narrative Split Banner with Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-bold text-[#10222B]">
              Direct-Trade Partnerships. Zero Brokers.
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Every bean passing through our roaster is purchased directly from producers we visit annually before harvest. By guaranteeing multi-year contracts at 42% above market floor prices, we empower agronomy partners to invest in organic compost bio-reactors, raised bed solar drying, and living farm wages.
            </p>
            <div className="p-6 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] space-y-2">
              <div className="flex items-center gap-2 text-[#1B8585] font-bold text-xs uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>The Direct-Trade Standard</span>
              </div>
              <p className="text-xs text-stone-600">
                100% of our green coffee purchases are accompanied by published FOB receipts, ensuring complete financial transparency from origin gate to customer cup.
              </p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-warm-xl border-4 border-white aspect-[4/3] bg-stone-900">
            <img
              src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80"
              alt="Sensory Coffee Cupping Table"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Direct-Trade Farm Partners Grid */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B8585]">
              Global Microlots
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#10222B]">
              Our Generational Farm Partners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {originPartners.map((partner, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl overflow-hidden border border-[#D2DFE2] shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                  <img src={partner.image} alt={partner.farm} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#1B8585] font-bold uppercase block">
                      {partner.altitude} • {partner.process}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#10222B]">
                      {partner.farm}
                    </h3>
                    <span className="text-xs text-stone-500">{partner.country}</span>
                  </div>
                  <div className="pt-2 border-t border-[#D2DFE2]/70 text-xs text-stone-600">
                    <strong className="text-[#10222B]">Tasting Notes:</strong> {partner.flavor}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
