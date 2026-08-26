import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { DietaryBadge, LiveAvailabilityBadge } from '../common/Badge';
import { OptimizedImage } from '../common/OptimizedImage';
import { formatCurrency } from '../../utils/currency';
import { usePromotion } from '../../context/PromotionContext';
import { Sparkles, Clock, Info, Check, Eye, Zap, Flame } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const { calculateDiscount } = usePromotion();
  const isAvailable = item.isAvailable !== false;
  const discountInfo = calculateDiscount(item);

  return (
    <>
      <div 
        className={`group bg-white rounded-3xl overflow-hidden border border-[#D2DFE2]/80 shadow-warm-sm hover:shadow-warm-lg transition-all duration-300 flex flex-col justify-between ${
          !isAvailable ? 'opacity-70 bg-stone-50/80 grayscale-[30%]' : ''
        }`}
      >
        {/* Top Image & Overlays */}
        <div 
          className="relative aspect-[16/10] overflow-hidden bg-[#E5ECEE] cursor-pointer" 
          onClick={() => setShowModal(true)}
        >
          <OptimizedImage
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow">
              <Eye className="w-3.5 h-3.5 text-[#77C7C6]" />
              Explore tasting notes & pairings
            </span>
          </div>

          {/* Price Tag Badge (With Strikethrough Markdown if Discounted) */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#10222B]/90 backdrop-blur-sm shadow-warm-sm border border-[#1B8585]/40 flex items-center gap-1.5">
            {discountInfo.isDiscounted ? (
              <>
                <span className="line-through text-stone-400 text-xs font-normal">
                  {formatCurrency(discountInfo.originalPrice)}
                </span>
                <span className="text-amber-300 font-bold text-sm">
                  {formatCurrency(discountInfo.discountedPrice)}
                </span>
              </>
            ) : (
              <span className="text-[#77C7C6] font-semibold text-sm">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>

          {/* Happy Hour Discount Badge */}
          {discountInfo.isDiscounted && isAvailable ? (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span>{discountInfo.discountPercent}% OFF • Happy Hour</span>
            </div>
          ) : item.featured ? (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#1B8585] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#77C7C6]" />
              <span>Signature Roast</span>
            </div>
          ) : null}

          {/* Sold Out Synchronous Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="px-4 py-2 rounded-full bg-rose-600/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 border border-rose-400/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Sold Out for Today
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Dietary Badges & Category */}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.dietaryTags.map(tag => (
                <DietaryBadge key={tag} tag={tag} size="sm" />
              ))}
              <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold ml-auto">
                {item.category.split('&')[0].trim()}
              </span>
            </div>

            {/* Title */}
            <h3 
              onClick={() => setShowModal(true)}
              className="font-serif text-lg font-bold text-[#10222B] group-hover:text-[#1B8585] transition-colors cursor-pointer leading-snug"
            >
              {item.name}
            </h3>

            {/* Description */}
            <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* Tasting Notes / Meta */}
          <div className="pt-3 border-t border-[#D2DFE2]/60 space-y-3">
            {item.tastingNotes && item.tastingNotes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mr-1">Notes:</span>
                {item.tastingNotes.map((note, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2F6F7] text-[#1E3A47] font-medium border border-[#D2DFE2]/70">
                    {note}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#1B8585]" />
                {item.prepTime || 'Freshly Baked'}
              </span>

              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-semibold text-[#1B8585] hover:text-[#10222B] transition-colors flex items-center gap-1"
              >
                <span>Pairings & Profile</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Lightbox Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-[#F6F9FA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#D2DFE2] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] bg-stone-900">
              <OptimizedImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors text-xs"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4">
                <LiveAvailabilityBadge isAvailable={isAvailable} />
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest font-semibold text-[#1B8585]">
                    {item.category}
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#10222B] mt-0.5">
                    {item.name}
                  </h2>
                </div>
                
                <div className="text-right">
                  {discountInfo.isDiscounted ? (
                    <div>
                      <span className="line-through text-stone-400 text-sm block font-normal">
                        {formatCurrency(discountInfo.originalPrice)}
                      </span>
                      <span className="font-serif text-2xl font-bold text-amber-600">
                        {formatCurrency(discountInfo.discountedPrice)}
                      </span>
                    </div>
                  ) : (
                    <div className="font-serif text-2xl font-bold text-[#1B8585]">
                      {formatCurrency(item.price)}
                    </div>
                  )}
                </div>
              </div>

              {discountInfo.isDiscounted && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Flame className="w-4 h-4 text-amber-600" />
                    Zero-Waste End-of-Day Markdown ({discountInfo.discountPercent}% OFF)
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Save {formatCurrency(discountInfo.savingsAmount)}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {item.dietaryTags.map(tag => (
                  <DietaryBadge key={tag} tag={tag} size="md" showLabel={true} />
                ))}
              </div>

              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                {item.description}
              </p>

              {item.tastingNotes && item.tastingNotes.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] space-y-2">
                  <span className="text-xs font-bold text-[#10222B] uppercase tracking-wider block">
                    Curated Flavor & Sensory Notes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tastingNotes.map((note, idx) => (
                      <span key={idx} className="text-xs px-3 py-1 rounded-xl bg-[#F2F6F7] text-[#10222B] font-medium border border-[#D2DFE2] shadow-xs">
                        ✦ {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#D2DFE2] flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  Estimated prep time: <strong>{item.prepTime || '3-5 minutes'}</strong>
                </span>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-semibold hover:bg-[#1E3A47] transition-colors"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
