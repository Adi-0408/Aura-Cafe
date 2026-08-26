import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { PromotionSettings, MenuItem, ItemDiscountCalculation } from '../types';
import { WEEKLY_SCHEDULE } from '../utils/date';
import { 
  DEFAULT_PROMOTION_SETTINGS, 
  fetchPromotionSettings, 
  savePromotionSettings, 
  recordDiscountSavings 
} from '../services/firebaseService';

interface PromotionContextType {
  settings: PromotionSettings;
  isHappyHourActive: boolean;
  minutesRemaining: number;
  timeRemainingText: string;
  isManualOverride: boolean;
  calculateDiscount: (item: { price: number; category?: string; isPerishable?: boolean; name?: string }) => ItemDiscountCalculation;
  triggerFlashSale: (durationMinutes?: number) => Promise<void>;
  stopFlashSale: () => Promise<void>;
  updateSettings: (newSettings: Partial<PromotionSettings>) => Promise<void>;
  trackPurchaseSavings: (savings: number, itemsCount: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PromotionSettings>(() => {
    const saved = localStorage.getItem('aura_promotion_settings_v1');
    return saved ? JSON.parse(saved) : DEFAULT_PROMOTION_SETTINGS;
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep time ticker up to date every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('aura_promotion_settings_v1', JSON.stringify(settings));
  }, [settings]);

  // Load from Firestore
  const refreshSettings = async () => {
    try {
      const data = await fetchPromotionSettings();
      setSettings(data);
    } catch (e) {
      console.warn('Using local promotion settings:', e);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Compute Happy Hour Active state & countdown
  const { isHappyHourActive, minutesRemaining, timeRemainingText, isManualOverride } = useMemo(() => {
    const now = currentTime;
    const nowMs = now.getTime();

    // 1. Check Manual Override first
    if (settings.manualOverrideActive) {
      if (settings.manualOverrideExpiresAt) {
        if (nowMs < settings.manualOverrideExpiresAt) {
          const diffMs = settings.manualOverrideExpiresAt - nowMs;
          const mins = Math.max(1, Math.ceil(diffMs / (1000 * 60)));
          return {
            isHappyHourActive: true,
            minutesRemaining: mins,
            timeRemainingText: `${mins} min${mins > 1 ? 's' : ''}`,
            isManualOverride: true,
          };
        } else {
          // Flash sale expired
          return {
            isHappyHourActive: false,
            minutesRemaining: 0,
            timeRemainingText: '',
            isManualOverride: false,
          };
        }
      }
      return {
        isHappyHourActive: true,
        minutesRemaining: 60,
        timeRemainingText: 'Manual Flash Sale Active',
        isManualOverride: true,
      };
    }

    // 2. Check Automated End-of-Day Schedule
    if (!settings.eodDiscountEnabled) {
      return {
        isHappyHourActive: false,
        minutesRemaining: 0,
        timeRemainingText: '',
        isManualOverride: false,
      };
    }

    const dayIndex = now.getDay();
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const schedule = isWeekend ? WEEKLY_SCHEDULE.weekend : WEEKLY_SCHEDULE.weekday;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutesFromMidnight = currentHour * 60 + currentMinute;
    const closeMinutes = schedule.closeHour * 60 + schedule.closeMinute;

    const triggerThreshold = closeMinutes - (settings.minutesBeforeClose || 60);

    // Active if within [closeMinutes - minutesBeforeClose, closeMinutes)
    if (currentMinutesFromMidnight >= triggerThreshold && currentMinutesFromMidnight < closeMinutes) {
      const minsLeft = closeMinutes - currentMinutesFromMidnight;
      return {
        isHappyHourActive: true,
        minutesRemaining: minsLeft,
        timeRemainingText: `${minsLeft} min${minsLeft > 1 ? 's' : ''}`,
        isManualOverride: false,
      };
    }

    return {
      isHappyHourActive: false,
      minutesRemaining: 0,
      timeRemainingText: '',
      isManualOverride: false,
    };
  }, [currentTime, settings]);

  // Evaluate item discount eligibility
  const calculateDiscount = (item: { price: number; category?: string; isPerishable?: boolean; name?: string }): ItemDiscountCalculation => {
    const originalPrice = item.price;

    if (!isHappyHourActive) {
      return {
        originalPrice,
        discountedPrice: originalPrice,
        discountPercent: 0,
        isDiscounted: false,
        savingsAmount: 0,
      };
    }

    // Check if category is eligible or item is explicitly marked perishable
    const cat = item.category || '';
    const isCategoryEligible = settings.eligibleCategories.some(
      ec => ec.toLowerCase() === cat.toLowerCase() || cat.toLowerCase().includes(ec.toLowerCase())
    );

    const isEligible = item.isPerishable === true || isCategoryEligible;

    if (!isEligible) {
      return {
        originalPrice,
        discountedPrice: originalPrice,
        discountPercent: 0,
        isDiscounted: false,
        savingsAmount: 0,
      };
    }

    const percent = settings.discountPercent || 40;
    const discountMultiplier = (100 - percent) / 100;
    const discountedPrice = Math.round(originalPrice * discountMultiplier);
    const savingsAmount = originalPrice - discountedPrice;

    return {
      originalPrice,
      discountedPrice,
      discountPercent: percent,
      isDiscounted: true,
      savingsAmount,
      badgeLabel: `⚡ ${percent}% OFF • End-of-Day Zero-Waste Special`,
    };
  };

  const triggerFlashSale = async (durationMinutes: number = 60) => {
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    const newSettings: PromotionSettings = {
      ...settings,
      manualOverrideActive: true,
      manualOverrideExpiresAt: expiresAt,
    };
    setSettings(newSettings);
    await savePromotionSettings(newSettings);
  };

  const stopFlashSale = async () => {
    const newSettings: PromotionSettings = {
      ...settings,
      manualOverrideActive: false,
      manualOverrideExpiresAt: null,
    };
    setSettings(newSettings);
    await savePromotionSettings(newSettings);
  };

  const updateSettings = async (newProps: Partial<PromotionSettings>) => {
    const merged = { ...settings, ...newProps };
    setSettings(merged);
    await savePromotionSettings(merged);
  };

  const trackPurchaseSavings = async (savings: number, itemsCount: number) => {
    if (savings <= 0) return;
    const updated = {
      ...settings,
      totalRevenueSaved: (settings.totalRevenueSaved || 0) + savings,
      totalItemsRescued: (settings.totalItemsRescued || 0) + itemsCount,
    };
    setSettings(updated);
    await recordDiscountSavings(savings, itemsCount);
  };

  return (
    <PromotionContext.Provider
      value={{
        settings,
        isHappyHourActive,
        minutesRemaining,
        timeRemainingText,
        isManualOverride,
        calculateDiscount,
        triggerFlashSale,
        stopFlashSale,
        updateSettings,
        trackPurchaseSavings,
        refreshSettings,
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};
