import React, { useState } from 'react';
import { usePromotion } from '../../context/PromotionContext';
import { useMenu } from '../../context/MenuContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Zap, 
  Flame, 
  Clock, 
  Percent, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Sliders,
  CheckCircle2,
  RefreshCw,
  Power
} from 'lucide-react';

const AVAILABLE_CATEGORIES = [
  'Artisan Bakery',
  'All-Day Brunch',
  'Cold Brews & Teas',
  'Espresso & Specialty Coffee'
];

export const PromotionsManager: React.FC = () => {
  const { 
    settings, 
    isHappyHourActive, 
    timeRemainingText, 
    isManualOverride, 
    triggerFlashSale, 
    stopFlashSale, 
    updateSettings,
    refreshSettings
  } = usePromotion();

  const { menuItems } = useMenu();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [eodDiscountEnabled, setEodDiscountEnabled] = useState(settings.eodDiscountEnabled);
  const [discountPercent, setDiscountPercent] = useState(settings.discountPercent);
  const [minutesBeforeClose, setMinutesBeforeClose] = useState(settings.minutesBeforeClose);
  const [eligibleCategories, setEligibleCategories] = useState<string[]>(settings.eligibleCategories || ['Artisan Bakery', 'All-Day Brunch']);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    await updateSettings({
      eodDiscountEnabled,
      discountPercent: Number(discountPercent),
      minutesBeforeClose: Number(minutesBeforeClose),
      eligibleCategories,
    });

    setSaving(false);
    setSuccessMsg('Promotion & Zero-Waste engine settings saved to Firestore database!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCategoryToggle = (category: string) => {
    setEligibleCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTriggerFlash = async (minutes: number) => {
    await triggerFlashSale(minutes);
    setSuccessMsg(`Emergency Flash Sale activated for ${minutes} minutes!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStopFlash = async () => {
    await stopFlashSale();
    setSuccessMsg('Emergency Flash Sale terminated. Regular pricing restored.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner & Title */}
      <div className="bg-[#10222B] rounded-3xl p-6 sm:p-8 text-white border border-[#1E3A47] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-warm-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-amber-300" />
              <span>Zero-Waste Dynamic Engine</span>
            </span>
            {isHappyHourActive && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30 animate-pulse">
                ● Live Active Now
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            End-of-Day Happy Hour & Perishable Markdown Hub
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Automatically applies markdown discounts on fresh bakery, pastries, and kitchen plates during the final hour before close to prevent food waste and recover kitchen surplus revenue.
          </p>
        </div>

        {/* Live Status Card */}
        <div className="p-4 rounded-2xl bg-[#152A35] border border-[#1E3A47] min-w-[240px] text-right space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Happy Hour Engine Status</span>
          <div className="flex items-center justify-end gap-2">
            <span className={`w-3 h-3 rounded-full ${isHappyHourActive ? 'bg-amber-400 animate-ping' : 'bg-stone-500'}`}></span>
            <strong className="font-serif text-base text-white">
              {isHappyHourActive ? 'Happy Hour LIVE' : 'Standby Mode'}
            </strong>
          </div>
          {isHappyHourActive && (
            <span className="text-xs text-amber-300 font-mono block">
              Ends in {timeRemainingText} {isManualOverride ? '(Flash Sale)' : '(Automated)'}
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1: Revenue Recovered */}
        <div className="p-6 rounded-3xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase">
            <span>Revenue Recovered</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl sm:text-3xl text-[#10222B]">
            {formatCurrency(settings.totalRevenueSaved || 0)}
          </div>
          <p className="text-[11px] text-stone-500">
            Total sales value rescued from surplus perishables that would otherwise have been written off as waste.
          </p>
        </div>

        {/* Metric 2: Pastries / Plates Rescued */}
        <div className="p-6 rounded-3xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase">
            <span>Perishables Rescued</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl sm:text-3xl text-[#10222B]">
            {settings.totalItemsRescued || 0} <span className="text-sm font-sans font-normal text-stone-400">items</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Fresh bakery croissants, sourdough bakes, and daily food items sold during Happy Hour windows.
          </p>
        </div>

        {/* Metric 3: Active Rule Setting */}
        <div className="p-6 rounded-3xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase">
            <span>Active Discount Rule</span>
            <div className="w-8 h-8 rounded-xl bg-[#E5ECEE] text-[#1B8585] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl sm:text-3xl text-[#1B8585]">
            {settings.discountPercent}% OFF
          </div>
          <p className="text-[11px] text-stone-500">
            Triggers {settings.minutesBeforeClose} mins before daily closing time across {settings.eligibleCategories.length} categories.
          </p>
        </div>

      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Promotion Settings Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#D2DFE2]/80 shadow-warm-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D2DFE2]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F2F6F7] text-[#1B8585] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#10222B]">
                  Automated Discount Configuration
                </h3>
                <p className="text-xs text-stone-500">
                  Manage schedule triggers, markdown rate, and category scoping
                </p>
              </div>
            </div>

            <button
              onClick={refreshSettings}
              className="p-2 rounded-xl text-stone-400 hover:text-[#10222B] hover:bg-[#F2F6F7] transition-colors"
              title="Refresh from Firestore"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Master Toggle */}
            <div className="p-4 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] flex items-center justify-between">
              <div>
                <label className="font-serif font-bold text-sm text-[#10222B] block">
                  Automated End-of-Day Happy Hour
                </label>
                <span className="text-xs text-stone-500 block mt-0.5">
                  Automatically activates markdown pricing during the pre-closing window every evening.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEodDiscountEnabled(!eodDiscountEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  eodDiscountEnabled ? 'bg-[#1B8585]' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    eodDiscountEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Discount Percentage Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Discount Markdown Rate:
                </label>
                <span className="font-mono font-bold text-sm text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {discountPercent}% OFF
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-2 bg-[#D2DFE2] rounded-lg appearance-none cursor-pointer accent-[#1B8585]"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>10% (Mild)</span>
                <span>40% (Recommended)</span>
                <span>70% (Clearance)</span>
              </div>
            </div>

            {/* Trigger Window (Minutes Before Closing) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Trigger Window (Minutes Before Close):
                </label>
                <span className="font-mono font-bold text-sm text-[#1B8585] bg-[#E5ECEE] px-2.5 py-0.5 rounded-lg border border-[#D2DFE2]">
                  {minutesBeforeClose} minutes
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={minutesBeforeClose}
                onChange={(e) => setMinutesBeforeClose(Number(e.target.value))}
                className="w-full h-2 bg-[#D2DFE2] rounded-lg appearance-none cursor-pointer accent-[#1B8585]"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>15 mins</span>
                <span>60 mins (Standard)</span>
                <span>180 mins (3 Hours)</span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-stone-700 block">
                Eligible Perishable Categories:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isChecked = eligibleCategories.includes(cat);
                  return (
                    <div
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#E5ECEE] border-[#1B8585] text-[#10222B] font-semibold'
                          : 'bg-[#F2F6F7] border-[#D2DFE2] text-stone-600 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">{cat}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        isChecked ? 'bg-[#1B8585] text-white' : 'bg-white border border-[#D2DFE2]'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-400 italic">
                * Note: Whole coffee bean bags, syrups, packaging, and non-perishables are automatically excluded from Happy Hour discounts.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#D2DFE2]/60 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-white text-xs font-bold transition-all shadow-warm-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#77C7C6]" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#77C7C6]" />
                    <span>Save Discount Rules</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Flash Sale Override & Product Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Emergency Flash Sale Box */}
          <div className="bg-[#10222B] text-white rounded-3xl p-6 sm:p-7 border border-[#1E3A47] shadow-warm-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Zap className="w-5 h-5 fill-amber-300" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-white">
                  Manual Flash Sale Trigger
                </h4>
                <p className="text-xs text-stone-300">
                  Override schedule on high surplus days
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Instantly broadcast the Zero-Waste Happy Hour banner and markdown pricing across the public storefront regardless of the time of day.
            </p>

            {isHappyHourActive && isManualOverride ? (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-200">⚡ Flash Sale Running</span>
                  <span className="font-mono text-amber-300">Ends in {timeRemainingText}</span>
                </div>
                <button
                  onClick={handleStopFlash}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  <span>End Flash Sale Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleTriggerFlash(30)}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all text-center"
                >
                  <span className="block text-[10px] text-amber-300 font-mono">QUICK</span>
                  <span>30 Mins</span>
                </button>

                <button
                  onClick={() => handleTriggerFlash(60)}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all text-center shadow-xs"
                >
                  <span className="block text-[10px] text-amber-100 font-mono">POPULAR</span>
                  <span>1 Hour</span>
                </button>

                <button
                  onClick={() => handleTriggerFlash(120)}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all text-center"
                >
                  <span className="block text-[10px] text-amber-300 font-mono">EXTENDED</span>
                  <span>2 Hours</span>
                </button>
              </div>
            )}
          </div>

          {/* Pricing Preview Panel */}
          <div className="bg-white rounded-3xl p-6 border border-[#D2DFE2]/80 shadow-warm-sm space-y-4">
            <h4 className="font-serif font-bold text-sm text-[#10222B] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1B8585]" />
              <span>Live Happy Hour Price Preview</span>
            </h4>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {menuItems
                .filter(item => eligibleCategories.includes(item.category))
                .slice(0, 6)
                .map((item) => {
                  const discountRate = (100 - discountPercent) / 100;
                  const previewDiscountPrice = Math.round(item.price * discountRate);

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2]/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-[#10222B] block font-serif">{item.name}</strong>
                        <span className="text-stone-400 text-[10px] font-mono">{item.category}</span>
                      </div>

                      <div className="text-right">
                        <span className="line-through text-stone-400 text-[11px] block">
                          {formatCurrency(item.price)}
                        </span>
                        <strong className="text-amber-600 font-bold font-mono">
                          {formatCurrency(previewDiscountPrice)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
