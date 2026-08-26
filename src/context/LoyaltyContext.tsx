import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { TokenLogEntry } from '../types';
import * as firebaseService from '../services/firebaseService';

interface FeeCalculation {
  baseFee: number;
  surchargeRate: number;
  surchargeAmount: number;
  totalAmount: number;
}

interface LoyaltyContextType {
  tokenBalance: number;
  freeReservationsAvailable: number;
  totalLifetimeTokens: number;
  tokenHistory: TokenLogEntry[];
  calculateBookingFee: (guests: number, isRewardRedeemed?: boolean) => FeeCalculation;
  awardToken: (reservationId: string) => Promise<{ newBalance: number; freeUnlocked: boolean }>;
  redeemFreeReservation: (reservationId: string) => Promise<boolean>;
  adminAdjustUserTokens: (uidOrEmail: string, delta: number, note?: string) => Promise<{ newBalance: number; newFree: number } | null>;
  refreshLoyalty: () => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    return user?.tokenBalance !== undefined ? user.tokenBalance : 0;
  });
  const [freeReservationsAvailable, setFreeReservationsAvailable] = useState<number>(() => {
    return user?.freeReservationsAvailable !== undefined ? user.freeReservationsAvailable : 0;
  });
  const [totalLifetimeTokens, setTotalLifetimeTokens] = useState<number>(() => {
    return user?.totalLifetimeTokens !== undefined ? user.totalLifetimeTokens : 0;
  });
  const [tokenHistory, setTokenHistory] = useState<TokenLogEntry[]>(() => {
    return user?.tokenHistory || [];
  });

  // Sync with auth user updates
  useEffect(() => {
    if (user) {
      setTokenBalance(user.tokenBalance !== undefined ? user.tokenBalance : 0);
      setFreeReservationsAvailable(user.freeReservationsAvailable !== undefined ? user.freeReservationsAvailable : 0);
      setTotalLifetimeTokens(user.totalLifetimeTokens !== undefined ? user.totalLifetimeTokens : 0);
      setTokenHistory(user.tokenHistory || []);
    } else {
      setTokenBalance(0);
      setFreeReservationsAvailable(0);
      setTotalLifetimeTokens(0);
      setTokenHistory([]);
    }
  }, [user]);

  const refreshLoyalty = async () => {
    if (!user?.email) return;
    try {
      const freshUser = await firebaseService.findUserByEmail(user.email);
      if (freshUser) {
        setTokenBalance(freshUser.tokenBalance !== undefined ? freshUser.tokenBalance : 0);
        setFreeReservationsAvailable(freshUser.freeReservationsAvailable !== undefined ? freshUser.freeReservationsAvailable : 0);
        setTotalLifetimeTokens(freshUser.totalLifetimeTokens !== undefined ? freshUser.totalLifetimeTokens : 0);
        setTokenHistory(freshUser.tokenHistory || []);
      }
    } catch (err) {
      console.warn('Could not refresh loyalty state:', err);
    }
  };

  /**
   * 2% Reservation Fee calculation
   * baseDeposit = Math.max(200, guests * 100)  (₹200 minimum deposit or ₹100/guest)
   * surcharge = 2% of baseDeposit
   * If reward redeemed, fees are 100% waived to ₹0.00
   */
  const calculateBookingFee = (guests: number, isRewardRedeemed = false): FeeCalculation => {
    if (isRewardRedeemed) {
      return {
        baseFee: 0,
        surchargeRate: 0.02,
        surchargeAmount: 0,
        totalAmount: 0
      };
    }

    const baseFee = Math.max(200, guests * 100);
    const surchargeRate = 0.02;
    const surchargeAmount = Number((baseFee * surchargeRate).toFixed(2));
    const totalAmount = Number((baseFee + surchargeAmount).toFixed(2));

    return {
      baseFee,
      surchargeRate,
      surchargeAmount,
      totalAmount
    };
  };

  const awardToken = async (reservationId: string): Promise<{ newBalance: number; freeUnlocked: boolean }> => {
    if (!user?.email) return { newBalance: 1, freeUnlocked: false };

    try {
      const result = await firebaseService.awardReservationToken(user.email, reservationId);
      setTokenBalance(result.newBalance);
      if (result.freeUnlocked) {
        setFreeReservationsAvailable(prev => prev + 1);
      }
      setTotalLifetimeTokens(prev => prev + 1);
      return result;
    } catch (err) {
      // Local optimistic fallback
      const newTokens = tokenBalance + 1;
      const freeUnlocked = newTokens >= 10;
      const newBal = freeUnlocked ? newTokens - 10 : newTokens;
      setTokenBalance(newBal);
      if (freeUnlocked) setFreeReservationsAvailable(prev => prev + 1);
      setTotalLifetimeTokens(prev => prev + 1);
      return { newBalance: newBal, freeUnlocked };
    }
  };

  const redeemFreeReservation = async (reservationId: string): Promise<boolean> => {
    if (!user?.email || freeReservationsAvailable <= 0) return false;

    try {
      const success = await firebaseService.redeemFreeReservationToken(user.email, reservationId);
      if (success) {
        setFreeReservationsAvailable(prev => Math.max(0, prev - 1));
      }
      return success;
    } catch (err) {
      setFreeReservationsAvailable(prev => Math.max(0, prev - 1));
      return true;
    }
  };

  const adminAdjustUserTokens = async (
    uidOrEmail: string, 
    delta: number, 
    note?: string
  ): Promise<{ newBalance: number; newFree: number } | null> => {
    try {
      const res = await firebaseService.adjustUserTokens(uidOrEmail, delta, note);
      if (res && user && (user.uid === uidOrEmail || user.email === uidOrEmail)) {
        setTokenBalance(res.newBalance);
        setFreeReservationsAvailable(res.newFree);
      }
      return res;
    } catch (err) {
      console.error('Error in admin token adjust:', err);
      return null;
    }
  };

  return (
    <LoyaltyContext.Provider
      value={{
        tokenBalance,
        freeReservationsAvailable,
        totalLifetimeTokens,
        tokenHistory,
        calculateBookingFee,
        awardToken,
        redeemFreeReservation,
        adminAdjustUserTokens,
        refreshLoyalty,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
