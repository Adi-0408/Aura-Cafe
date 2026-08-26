import React, { useState } from 'react';
import { GALLERY_ITEMS } from '../../services/mockData';
import { GalleryItem } from '../../types';
import { Sparkles, Eye, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const CATEGORIES = ['All', 'Interiors', 'Coffee Craft', 'Bakery & Food', 'Community'] as const;

export const GalleryMasonry: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const filtered = selectedCat === 'All'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(i => i.category === selectedCat);

  const activeItem = activeItemIndex !== null ? filtered[activeItemIndex] : null;

  const handleNext = () => {
    if (activeItemIndex !== null) {
      setActiveItemIndex((activeItemIndex + 1) % filtered.length);
    }
  };

  const handlePrev = () => {
    if (activeItemIndex !== null) {
      setActiveItemIndex((activeItemIndex - 1 + filtered.length) % filtered.length);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCat(cat);
              setActiveItemIndex(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              selectedCat === cat
                ? 'bg-[#10222B] text-[#F2F6F7]'
                : 'bg-white text-stone-700 hover:bg-[#F2F6F7] border border-[#D2DFE2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry-Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setActiveItemIndex(idx)}
            className="group relative rounded-3xl overflow-hidden bg-[#081318] border border-[#D2DFE2] shadow-warm-sm hover:shadow-warm-lg cursor-pointer transition-all duration-300"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Hover Caption Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#081318]/90 via-[#081318]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6 text-white">
              <div className="flex justify-end">
                <span className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                  <Eye className="w-4 h-4 text-white" />
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#77C7C6] block">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-bold">{item.title}</h3>
                <p className="text-xs text-stone-200 line-clamp-2">{item.caption}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveItemIndex(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#0E1D24] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveItemIndex(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Image */}
            <div className="relative aspect-[16/10] bg-black">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next Nav Buttons */}
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Caption Footer */}
            <div className="p-6 bg-[#10222B] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#77C7C6]">
                  {activeItem.category}
                </span>
                <h3 className="font-serif text-xl font-bold mt-0.5">{activeItem.title}</h3>
                <p className="text-xs text-stone-300 mt-1 max-w-xl">{activeItem.caption}</p>
              </div>

              <span className="text-xs font-mono text-stone-400 shrink-0">
                {(activeItemIndex ?? 0) + 1} of {filtered.length}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
