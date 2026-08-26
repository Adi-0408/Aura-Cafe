import React from 'react';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  CreditCard, 
  Store, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  QrCode, 
  Clock, 
  Sparkles, 
  Gift, 
  AlertCircle,
  Banknote,
  Zap,
  Info
} from 'lucide-react';

interface ReservationPaymentSelectorProps {
  selectedMethod: 'online' | 'at_location';
  onSelectMethod: (method: 'online' | 'at_location') => void;
  totalPayable: number;
  isRewardRedeemed: boolean;
  onlineSubMethod: 'card' | 'upi' | 'wallet';
  onSelectOnlineSubMethod: (sub: 'card' | 'upi' | 'wallet') => void;
  cardNumber: string;
  onCardNumberChange: (v: string) => void;
  cardExpiry: string;
  onCardExpiryChange: (v: string) => void;
  upiId: string;
  onUpiIdChange: (v: string) => void;
}

export const ReservationPaymentSelector: React.FC<ReservationPaymentSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  totalPayable,
  isRewardRedeemed,
  onlineSubMethod,
  onSelectOnlineSubMethod,
  cardNumber,
  onCardNumberChange,
  cardExpiry,
  onCardExpiryChange,
  upiId,
  onUpiIdChange
}) => {
  // If 10-token reward is redeemed, fee is waived
  if (isRewardRedeemed) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-[#EBF7F7] border border-emerald-300 text-emerald-950 space-y-2 text-xs animate-fade-in">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
          <Gift className="w-5 h-5 text-emerald-600" />
          <span>Payment Bypassed — 10-Token Reward Active</span>
        </div>
        <p className="text-emerald-800">
          Your booking deposit & 2% service charge are 100% waived. No payment is required for this reservation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#10222B]">
          Select Payment Preference *
        </label>
        <span className="text-[11px] text-stone-400 font-mono">
          🔒 256-Bit SSL Encrypted
        </span>
      </div>

      {/* Dual Selectable Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* OPTION A: Pay Online */}
        <div
          onClick={() => onSelectMethod('online')}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 relative ${
            selectedMethod === 'online'
              ? 'bg-[#EBF7F7] border-[#1B8585] ring-2 ring-[#1B8585]/30 shadow-warm-xs'
              : 'bg-white border-[#D2DFE2] hover:border-[#1B8585]/60 hover:bg-[#F2F6F7]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedMethod === 'online' ? 'bg-[#1B8585] text-white' : 'bg-[#F2F6F7] text-stone-700'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#10222B]">
                    Pay Online
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
                    Instant Table Confirmation
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Recommended
                </span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedMethod === 'online' ? 'bg-[#1B8585] text-white' : 'border border-stone-300'
                }`}>
                  {selectedMethod === 'online' && <Check className="w-3 h-3" />}
                </span>
              </div>
            </div>

            <p className="text-stone-600 text-xs leading-relaxed">
              Fast, digital checkout via UPI, GPay, or Cards. Instant lock-in with guaranteed table hold.
            </p>
          </div>

          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-medium text-stone-500">
            <span>Amount: <strong>{formatCurrency(totalPayable)}</strong></span>
            <span className="text-[#1B8585] font-bold">☕ +1 Token on Payment</span>
          </div>
        </div>

        {/* OPTION B: Pay at Location */}
        <div
          onClick={() => onSelectMethod('at_location')}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 relative ${
            selectedMethod === 'at_location'
              ? 'bg-[#EBF7F7] border-[#1B8585] ring-2 ring-[#1B8585]/30 shadow-warm-xs'
              : 'bg-white border-[#D2DFE2] hover:border-[#1B8585]/60 hover:bg-[#F2F6F7]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedMethod === 'at_location' ? 'bg-[#1B8585] text-white' : 'bg-[#F2F6F7] text-stone-700'
                }`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#10222B]">
                    Pay at Café
                  </h4>
                  <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block">
                    Pay on Arrival
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                  Cash or Card
                </span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  selectedMethod === 'at_location' ? 'bg-[#1B8585] text-white' : 'border border-stone-300'
                }`}>
                  {selectedMethod === 'at_location' && <Check className="w-3 h-3" />}
                </span>
              </div>
            </div>

            <p className="text-stone-600 text-xs leading-relaxed">
              Pay the deposit at the host counter upon arrival with cash, card, or UPI.
            </p>
          </div>

          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-medium text-stone-500">
            <span>Due at venue: <strong>{formatCurrency(totalPayable)}</strong></span>
            <span className="text-stone-600 font-medium">☕ +1 Token upon Arrival</span>
          </div>
        </div>

      </div>

      {/* CONDITIONAL SUB-FORM: Pay Online Gateway Mock */}
      {selectedMethod === 'online' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D2DFE2] space-y-4 animate-fade-in shadow-warm-xs">
          <div className="flex items-center justify-between border-b border-[#D2DFE2]/60 pb-3">
            <span className="text-xs font-bold text-[#10222B]">Digital Payment Channel</span>
            
            {/* Sub-method Tabs */}
            <div className="flex items-center gap-1 bg-[#F2F6F7] p-1 rounded-xl border border-[#D2DFE2]">
              <button
                type="button"
                onClick={() => onSelectOnlineSubMethod('upi')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  onlineSubMethod === 'upi' ? 'bg-[#10222B] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                UPI / GPay
              </button>
              <button
                type="button"
                onClick={() => onSelectOnlineSubMethod('card')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  onlineSubMethod === 'card' ? 'bg-[#10222B] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => onSelectOnlineSubMethod('wallet')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  onlineSubMethod === 'wallet' ? 'bg-[#10222B] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                NetBanking
              </button>
            </div>
          </div>

          {onlineSubMethod === 'upi' && (
            <div className="space-y-3 text-xs">
              <label className="block text-stone-700 font-semibold">
                UPI ID or Mobile Number *
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => onUpiIdChange(e.target.value)}
                  placeholder="e.g. mobile@okhdfcbank or 9820012345@paytm"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Supports Google Pay, PhonePe, Paytm, BHIM & Apple Pay.</span>
              </p>
            </div>
          )}

          {onlineSubMethod === 'card' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">Card Number *</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => onCardNumberChange(e.target.value)}
                      placeholder="4532 •••• •••• 8821"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">MM/YY *</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => onCardExpiryChange(e.target.value)}
                    placeholder="08/28"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono text-center text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Test Card simulation enabled for instant sandbox approval.</span>
              </p>
            </div>
          )}

          {onlineSubMethod === 'wallet' && (
            <div className="p-3 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-stone-600 space-y-1">
              <strong>Select Preferred NetBanking Partner:</strong>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'Others'].map((bank, i) => (
                  <button
                    key={bank}
                    type="button"
                    className="p-2 rounded-lg bg-white border border-[#D2DFE2] text-[11px] font-semibold text-stone-700 hover:border-[#1B8585] text-center truncate"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONDITIONAL NOTICE: Pay at Location Disclaimer */}
      {selectedMethod === 'at_location' && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Pay on Arrival Policy & Table Grace Period</span>
          </div>
          <p className="leading-relaxed text-amber-800 text-[11px]">
            Please arrive at least <strong>10 minutes prior</strong> to your reservation slot. Unclaimed tables may be released after a <strong>15-minute grace period</strong> to accommodate waitlist guests.
          </p>
          <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-900 font-semibold">
            <Banknote className="w-3.5 h-3.5 text-amber-700" />
            <span>Deposit payable at front desk: {formatCurrency(totalPayable)} (Cash, Card, or UPI)</span>
          </div>
        </div>
      )}

    </div>
  );
};
