import React from 'react';
import { GalleryMasonry } from '../../components/customer/GalleryMasonry';
import { Sparkles, Camera } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  return (
    <div className="py-16 bg-[#F6F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5ECEE] border border-[#D2DFE2] text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            <Camera className="w-3.5 h-3.5" />
            <span>Visual Anthology</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#10222B] tracking-tight">
            Spaces, Craft & Ocean Fog
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            A glimpse into the daily rituals at Aura—from early morning lamination on cold marble to our coastal slow cold drip extractions.
          </p>
        </div>

        {/* Masonry Gallery with Lightbox */}
        <GalleryMasonry />

      </div>
    </div>
  );
};
