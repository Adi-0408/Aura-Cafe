import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { MenuCategoryNav } from '../../components/customer/MenuCategoryNav';
import { MenuItemCard } from '../../components/customer/MenuItemCard';
import { DietaryBadge } from '../../components/common/Badge';
import { DIETARY_TAGS_META } from '../../services/mockData';
import { DietaryTag } from '../../types';
import { Sparkles, UtensilsCrossed, ShieldCheck, Heart, Waves } from 'lucide-react';

const DIETARY_LIST: DietaryTag[] = ['VG', 'V', 'GF', 'DF', 'N'];

export const MenuPage: React.FC = () => {
  const { filteredItems, loading } = useMenu();

  return (
    <div className="py-12 sm:py-16 bg-[#F6F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Page Title & Narrative */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5ECEE] border border-[#D2DFE2] text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            <Waves className="w-3.5 h-3.5" />
            <span>Pacific Coastal Extraction Journal</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#10222B] tracking-tight">
            Pacific Drip & Ocean Fog Menu
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            All espresso shots and slow cold drips are weighed to the tenth of a gram. Pastries are rolled by hand daily at dawn using pure French butter and ocean-mist wild cultures.
          </p>
        </div>

        {/* Filter Bar */}
        <MenuCategoryNav />

        {/* Menu Items Grid */}
        {loading ? (
          <div className="py-20 text-center text-stone-400">
            Loading coastal offerings...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#D2DFE2] space-y-3 p-8">
            <h3 className="font-serif text-xl font-bold text-[#10222B]">No matching recipes found</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try removing some dietary filters or clearing your search term to see more offerings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Dietary Legend Box */}
        <div className="bg-[#F2F6F7] p-8 rounded-3xl border border-[#D2DFE2] space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1B8585]" />
            <h3 className="font-serif text-lg font-bold text-[#10222B]">
              Dietary & Allergen Transparency Legend
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {DIETARY_LIST.map((tag) => {
              const meta = DIETARY_TAGS_META[tag];
              return (
                <div key={tag} className="bg-white p-3 rounded-2xl border border-[#D2DFE2]/80 space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <DietaryBadge tag={tag} size="sm" />
                    <span className="font-bold text-xs text-[#10222B]">{meta.label}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    {meta.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
