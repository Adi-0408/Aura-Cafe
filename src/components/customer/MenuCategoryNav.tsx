import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { MenuCategory, DietaryTag } from '../../types';
import { DIETARY_TAGS_META } from '../../services/mockData';
import { Search, X, Filter, Coffee, Sparkles, Utensils, CupSoda } from 'lucide-react';

const CATEGORIES: { label: string; value: MenuCategory | 'All'; icon: React.ReactNode }[] = [
  { label: 'All Offerings', value: 'All', icon: <Sparkles className="w-4 h-4" /> },
  { label: 'Espresso & Specialty', value: 'Espresso & Specialty Coffee', icon: <Coffee className="w-4 h-4" /> },
  { label: 'Cold Brews & Teas', value: 'Cold Brews & Teas', icon: <CupSoda className="w-4 h-4" /> },
  { label: 'Artisan Bakery', value: 'Artisan Bakery', icon: <Utensils className="w-4 h-4" /> },
  { label: 'All-Day Brunch', value: 'All-Day Brunch', icon: <Utensils className="w-4 h-4" /> },
];

const DIETARY_LIST: DietaryTag[] = ['VG', 'V', 'GF', 'DF', 'N'];

export const MenuCategoryNav: React.FC = () => {
  const {
    selectedCategory,
    selectedDietaryTags,
    searchQuery,
    filteredItems,
    setSelectedCategory,
    toggleDietaryFilter,
    clearFilters,
    setSearchQuery,
  } = useMenu();

  const hasActiveFilters = selectedCategory !== 'All' || selectedDietaryTags.length > 0 || searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-xs ${
                isSelected
                  ? 'bg-[#10222B] text-[#F2F6F7] shadow-warm-sm scale-100'
                  : 'bg-white text-[#1E3A47] hover:bg-[#F2F6F7] border border-[#D2DFE2]/80'
              }`}
            >
              <span className={isSelected ? 'text-[#77C7C6]' : 'text-stone-500'}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white p-4 rounded-2xl border border-[#D2DFE2]/80 shadow-warm-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Dietary Tag Badges Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#1B8585]" />
            Dietary:
          </span>
          {DIETARY_LIST.map((tag) => {
            const meta = DIETARY_TAGS_META[tag];
            const isSelected = selectedDietaryTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleDietaryFilter(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-[#1B8585] text-white border-[#1B8585] shadow-xs'
                    : 'bg-[#F2F6F7] text-stone-700 hover:bg-[#E5ECEE] border-[#D2DFE2]'
                }`}
              >
                {meta.label} ({tag})
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ingredient, tasting note..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#1B8585] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>Showing <strong>{filteredItems.length}</strong> creations</span>
        {hasActiveFilters && (
          <span className="text-[#1B8585] font-medium">Filters Applied</span>
        )}
      </div>

    </div>
  );
};
