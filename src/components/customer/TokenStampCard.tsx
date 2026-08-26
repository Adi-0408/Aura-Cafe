import React from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Sparkles, Gift, Check, Coffee, Zap, ShieldCheck, ChevronRight } from 'lucide-react';

interface TokenStampCardProps {
  showRedemptionToggle?: boolean;
  isRedeemingReward?: boolean;
  onToggleRedemption?: (enabled: boolean) => void;
  compact?: boolean;
}

export const TokenStampCard: React.FC<TokenStampCardProps> = ({
  showRedemptionToggle = false,
  isRedeemingReward = false,
  onToggleRedemption,
  compact = false
}) => {
  const { tokenBalance, freeReservationsAvailable, totalLifetimeTokens } = useLoyalty();

  const totalSlots = 10;
  const remaining = Math.max(0, totalSlots - tokenBalance);

  return (
    <div className={`rounded-3xl border transition-all ${
      compact 
        ? 'p-4 bg-[#F2F6F7] border-[#D2DFE2]' 
        : 'p-6 sm:p-7 bg-gradient-to-br from-[#10222B] to-[#1E3A47] text-white border-[#10222B] shadow-warm-lg'
    }`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
            compact ? 'bg-[#10222B] text-[#77C7C6]' : 'bg-[#1B8585] text-white'
          }`}>
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-serif font-bold text-base ${compact ? 'text-[#10222B]' : 'text-white'}`}>
                10-Token Loyalty Stamp Card
              </h4>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                compact ? 'bg-[#EBF7F7] text-[#1B8585] border border-[#A3DEDE]' : 'bg-[#77C7C6]/20 text-[#77C7C6] border border-[#77C7C6]/40'
              }`}>
                {tokenBalance}/10 Tokens
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${compact ? 'text-stone-500' : 'text-stone-300'}`}>
              Earn 1 Token per reservation. Every 10 Tokens unlocks <strong>1 FREE Reservation</strong> (100% deposit & surcharge waived).
            </p>
          </div>
        </div>

        {/* Lifetime Count */}
        <div className="text-left sm:text-right shrink-0">
          <span className={`text-[10px] uppercase font-bold block ${compact ? 'text-stone-400' : 'text-stone-400'}`}>
            Lifetime Earned
          </span>
          <span className={`font-mono font-bold text-sm ${compact ? 'text-[#10222B]' : 'text-[#77C7C6]'}`}>
            {totalLifetimeTokens} Tokens
          </span>
        </div>
      </div>

      {/* 10-Slot Stamp Grid */}
      <div className="py-5">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 sm:gap-3">
          {Array.from({ length: totalSlots }).map((_, index) => {
            const isEarned = index < tokenBalance;
            const isTenth = index === 9;

            return (
              <div
                key={index}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
                  isEarned
                    ? 'bg-gradient-to-br from-[#1B8585] to-[#249E9E] border-[#77C7C6] shadow-xs text-white scale-105 ring-2 ring-[#77C7C6]/40'
                    : isTenth
                    ? compact
                      ? 'bg-amber-50 border-dashed border-amber-300 text-amber-700'
                      : 'bg-amber-500/10 border-dashed border-amber-400/60 text-amber-300'
                    : compact
                    ? 'bg-white border-dashed border-stone-300 text-stone-400'
                    : 'bg-white/5 border-dashed border-white/20 text-white/40'
                }`}
              >
                {isEarned ? (
                  <>
                    <span className="text-base sm:text-lg animate-bounce-short">☕</span>
                    <span className="text-[9px] font-bold mt-0.5">#{index + 1}</span>
                  </>
                ) : isTenth ? (
                  <>
                    <Gift className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">FREE</span>
                  </>
                ) : (
                  <span className="text-[11px] font-mono font-semibold">
                    {index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Motivation Message */}
        <div className="mt-3.5 flex items-center justify-between text-xs">
          <span className={compact ? 'text-stone-600' : 'text-stone-300'}>
            {tokenBalance === 0 ? (
              <span>Book your next table to collect your first loyalty token!</span>
            ) : remaining > 0 ? (
              <span><strong>{remaining} more</strong> reservation{remaining > 1 ? 's' : ''} until your next free booking reward!</span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Stamp card complete! 1 Free reservation awarded.
              </span>
            )}
          </span>

          <span className={`text-[11px] font-medium ${compact ? 'text-stone-400' : 'text-stone-400'}`}>
            Auto-synced
          </span>
        </div>
      </div>

      {/* Free Reservation Unlocked Banner & Redemption Toggle */}
      {freeReservationsAvailable > 0 && (
        <div className={`p-4 rounded-2xl border transition-all mt-2 ${
          isRedeemingReward 
            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/40' 
            : compact
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-100'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <strong className="block text-sm font-bold">
                  🎉 {freeReservationsAvailable} Free Reservation Reward{freeReservationsAvailable > 1 ? 's' : ''} Available!
                </strong>
                <span className="text-xs opacity-90">
                  Waives 100% of the booking deposit & 2% service surcharge.
                </span>
              </div>
            </div>

            {showRedemptionToggle && onToggleRedemption && (
              <button
                type="button"
                onClick={() => onToggleRedemption(!isRedeemingReward)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isRedeemingReward
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white text-[#10222B] hover:bg-emerald-50'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${isRedeemingReward ? 'opacity-100' : 'opacity-0'}`} />
                <span>{isRedeemingReward ? 'Reward Applied (FREE)' : 'Apply Free Reward'}</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
