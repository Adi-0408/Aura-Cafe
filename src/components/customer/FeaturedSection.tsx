import React from 'react';
import { Link } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import { MenuItemCard } from './MenuItemCard';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FeaturedSection: React.FC = () => {
  const { menuItems } = useMenu();
  const featured = menuItems.filter(item => item.featured).slice(0, 4);

  return (
    <section className="py-20 bg-[#F6F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B8585]">
              <Sparkles className="w-3.5 h-3.5 text-[#3BAFA9]" />
              <span>Pacific Craft Highlights</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#10222B]">
              Signature House Creations
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Every recipe is dialed to milligram precision—from our single-origin cortado extractions to hand-laminated coastal viennoiserie.
            </p>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#10222B] hover:text-[#1B8585] group transition-colors shrink-0"
          >
            <span>View Full Menu & Pairings</span>
            <ArrowRight className="w-4 h-4 text-[#1B8585] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Featured Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>

      </div>
    </section>
  );
};
