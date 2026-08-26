import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReservation } from '../../context/ReservationContext';
import { useLoyalty } from '../../context/LoyaltyContext';
import { SeatingArea, Reservation, CafeTable, PaymentMethod, PaymentStatus } from '../../types';
import { AVAILABLE_TIME_SLOTS, getMinReservationDate, getMaxReservationDate, formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { TableGridSelector } from './TableGridSelector';
import { TokenStampCard } from './TokenStampCard';
import { ReservationPaymentSelector } from './ReservationPaymentSelector';
import { CustomSelect } from '../common/CustomSelect';
import confetti from 'canvas-confetti';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Coffee, 
  MapPin, 
  AlertCircle,
  Armchair,
  Sun,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Check,
  LayoutGrid,
  Info,
  Gift,
  Receipt,
  Tag,
  CreditCard,
  Store,
  Banknote
} from 'lucide-react';

export const ReservationForm: React.FC = () => {
  const { user } = useAuth();
  const { reservations, tables, createReservation, isSyncing } = useReservation();
  const { 
    tokenBalance, 
    freeReservationsAvailable, 
    calculateBookingFee, 
    awardToken, 
    redeemFreeReservation 
  } = useLoyalty();

  // Wizard Step State (1: Date & Guests, 2: Floor & Table Grid, 3: Guest Details & Checkout)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(getMinReservationDate());
  const [time, setTime] = useState('10:30 AM');
  const [guests, setGuests] = useState(2);
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const [seatingPreference, setSeatingPreference] = useState<SeatingArea>('Indoor Main Lounge');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isRedeemingReward, setIsRedeemingReward] = useState<boolean>(false);

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'at_location'>('online');
  const [onlineSubMethod, setOnlineSubMethod] = useState<'card' | 'upi' | 'wallet'>('upi');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [upiId, setUpiId] = useState('');
  
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [earnedTokenNotice, setEarnedTokenNotice] = useState<{ newBalance: number; freeUnlocked: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fee Calculation
  const feeDetails = calculateBookingFee(guests, isRedeemingReward);

  // Keep contact details populated with logged-in user
  useEffect(() => {
    if (user) {
      if (!customerName && user.displayName) setCustomerName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  // When a table is selected, synchronize the seatingPreference area
  const handleSelectTable = (table: CafeTable) => {
    setSelectedTable(table);
    setSeatingPreference(table.seatingArea);
  };

  // Live lookup of confirmed booking from context
  const activeConfirmedBooking = confirmedBookingId 
    ? (reservations.find(r => r.id === confirmedBookingId) || null) 
    : null;

  // Filter all bookings placed by this logged in user
  const userBookings = user 
    ? reservations.filter(r => r.email?.toLowerCase() === user.email?.toLowerCase())
    : [];

  // If user is not logged in, show mandatory login barrier
  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#D2DFE2] shadow-warm-xl text-center space-y-6 max-w-xl mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] text-[#1B8585] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#1B8585]">
            Member Authentication Required
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
            Sign In to Reserve a Table
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            To guarantee live table availability, select specific tables on the floor plan, earn 10-token loyalty rewards, and receive instant confirmations, reservations are exclusively available to authenticated members.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-stone-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1B8585]" />
          <span>Quick 1-click Google sign-in or member email login available.</span>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            state={{ from: { pathname: '/reservations' } }}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold uppercase tracking-wider transition-all shadow-warm-md hover:shadow-warm-lg active:scale-98"
          >
            <span>Sign In to Continue Booking</span>
            <ArrowRight className="w-4 h-4 text-[#77C7C6]" />
          </Link>
        </div>
      </div>
    );
  }

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!date || !time || !guests) {
        setError('Please select a date, time slot, and party size to view table availability.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName || !email || !phone || !date || !time) {
      setError('Please fill in all required contact fields.');
      return;
    }

    if (!isRedeemingReward && paymentMethod === 'online' && onlineSubMethod === 'upi' && !upiId) {
      setError('Please enter your UPI ID for online payment verification.');
      return;
    }

    try {
      const finalPaymentMethod: PaymentMethod = isRedeemingReward 
        ? 'token_redemption' 
        : paymentMethod;

      const finalPaymentStatus: PaymentStatus = isRedeemingReward 
        ? 'waived' 
        : paymentMethod === 'online' 
        ? 'paid' 
        : 'pending_at_venue';

      const res = await createReservation({
        customerName,
        email,
        phone,
        date,
        time,
        guests: Number(guests),
        seatingPreference,
        specialRequests,
        tableId: selectedTable?.id || null,
        tableName: selectedTable?.name || null,
        baseFee: feeDetails.baseFee,
        surchargeRate: feeDetails.surchargeRate,
        surchargeAmount: feeDetails.surchargeAmount,
        totalAmountPaid: feeDetails.totalAmount,
        paymentMethod: finalPaymentMethod,
        paymentStatus: finalPaymentStatus,
        isFreeRewardRedeemed: isRedeemingReward,
        tokenAwarded: finalPaymentStatus === 'paid',
        tokensAwarded: 1
      });

      if (isRedeemingReward) {
        await redeemFreeReservation(res.id);
      }

      // Online payment awards token immediately
      if (finalPaymentStatus === 'paid' || isRedeemingReward) {
        const tokenResult = await awardToken(res.id);
        setEarnedTokenNotice(tokenResult);
      }

      setConfirmedBookingId(res.id);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B8585', '#10222B', '#77C7C6', '#E29D52', '#3BAFA9']
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit reservation. Please try again.');
    }
  };

  const handleBookAnother = () => {
    setConfirmedBookingId(null);
    setSelectedTable(null);
    setIsRedeemingReward(false);
    setEarnedTokenNotice(null);
    setCardNumber('');
    setCardExpiry('');
    setUpiId('');
    setCurrentStep(1);
    setPhone('');
    setSpecialRequests('');
  };

  // Render Post-Submission Ticket State
  if (activeConfirmedBooking) {
    const isPaidOnline = activeConfirmedBooking.paymentStatus === 'paid';
    const isPayAtVenue = activeConfirmedBooking.paymentStatus === 'pending_at_venue';
    const isWaivedReward = activeConfirmedBooking.paymentStatus === 'waived' || activeConfirmedBooking.isFreeRewardRedeemed;

    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#D2DFE2] shadow-warm-xl text-center space-y-6 max-w-2xl mx-auto animate-fade-in">
        
        {/* Status Indicator Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border bg-emerald-50 border-emerald-200 text-emerald-700">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Dynamic Status Title */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
              🟢 Table Booking Confirmed
            </span>

            {isPaidOnline ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Paid Online</span>
              </span>
            ) : isPayAtVenue ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                <span>Pay on Arrival</span>
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>10-Token Reward Waived</span>
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
            Your Table is Confirmed, {activeConfirmedBooking.customerName}!
          </h3>

          <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            {isPayAtVenue ? (
              <>
                Your table is reserved for <strong>{formatDate(activeConfirmedBooking.date)} at {activeConfirmedBooking.time}</strong>. Please present your booking ID at the front desk to settle the <strong>{formatCurrency(activeConfirmedBooking.totalAmountPaid || 204)}</strong> deposit upon arrival.
              </>
            ) : (
              <>
                Your deposit and table reservation are locked in for <strong>{formatDate(activeConfirmedBooking.date)} at {activeConfirmedBooking.time}</strong>. We look forward to hosting you!
              </>
            )}
          </p>
        </div>

        {/* Post-Booking Token Reward Announcement (Online or Free) */}
        {earnedTokenNotice && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#10222B] to-[#1E3A47] text-white flex items-center justify-between gap-3 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☕</span>
              <div>
                <strong className="block text-xs uppercase tracking-wider text-[#77C7C6]">
                  +1 Loyalty Token Earned!
                </strong>
                <span className="text-xs text-stone-300">
                  Current Balance: <strong>{earnedTokenNotice.newBalance}/10 Tokens</strong>
                  {earnedTokenNotice.freeUnlocked && ' — 🎉 1 FREE Reservation Unlocked!'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#77C7C6] bg-white/10 px-2.5 py-1 rounded-lg">
              Stamp #{earnedTokenNotice.newBalance}
            </span>
          </div>
        )}

        {/* Booking Summary Ticket */}
        <div className="p-6 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] text-left space-y-4 text-xs sm:text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-[#D2DFE2]">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Booking Reference ID</span>
              <span className="font-mono font-bold text-[#10222B] text-base">{activeConfirmedBooking.id}</span>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Confirmed</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-stone-500 block text-xs">Date & Time</span>
              <span className="font-semibold text-[#10222B]">{formatDate(activeConfirmedBooking.date)} at {activeConfirmedBooking.time}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-xs">Party Size</span>
              <span className="font-semibold text-[#10222B]">{activeConfirmedBooking.guests} {activeConfirmedBooking.guests === 1 ? 'Guest' : 'Guests'}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-xs">Allocated Table</span>
              <span className="font-semibold text-[#1B8585]">{activeConfirmedBooking.tableName || activeConfirmedBooking.seatingPreference}</span>
            </div>
          </div>

          {/* Surcharge & Payment Breakdown */}
          <div className="pt-3 border-t border-[#D2DFE2] flex items-center justify-between text-xs">
            <span className="text-stone-500">
              Payment Method: <strong>{isPaidOnline ? '💳 Online (Paid in Full)' : isPayAtVenue ? '📍 Pay on Arrival' : '🎁 10-Token Reward'}</strong>
            </span>
            {isWaivedReward ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Fee Waived (₹0.00)
              </span>
            ) : isPayAtVenue ? (
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {formatCurrency(activeConfirmedBooking.totalAmountPaid || 204)} Due at Front Desk
              </span>
            ) : (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {formatCurrency(activeConfirmedBooking.totalAmountPaid || 204)} Paid
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleBookAnother}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#10222B] text-white text-xs font-semibold hover:bg-[#1E3A47] transition-colors flex items-center justify-center gap-2 shadow-warm-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Book Another Table</span>
          </button>

          <a
            href="/"
            className="px-6 py-3 rounded-xl bg-white border border-[#D2DFE2] text-[#10222B] text-xs font-semibold hover:bg-[#F2F6F7] transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      
      {/* Visual Token Stamp Card Showcase */}
      <TokenStampCard compact={false} />

      {/* Main Reservation Wizard Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D2DFE2] shadow-warm-lg space-y-8">
        
        {/* Form Title & Introduction */}
        <div className="space-y-2 border-b border-[#D2DFE2]/60 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B8585]">
              Table & Tasting Reservations
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F7] text-[#146868] text-[11px] font-semibold border border-[#A3DEDE]">
              <UserCheck className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Logged in as <strong>{user.displayName || user.email}</strong></span>
            </div>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
            Reserve Your Coastal Experience
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm">
            Select your date, pick your preferred table, and choose between instant online checkout or paying upon arrival at the café.
          </p>

          {/* 3-Step Wizard Navigation Indicator */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <div className={`p-2.5 rounded-2xl border text-center transition-all ${
              currentStep === 1 
                ? 'bg-[#10222B] text-white border-[#10222B] shadow-xs' 
                : currentStep > 1
                ? 'bg-[#EBF7F7] text-[#1B8585] border-[#1B8585]/30'
                : 'bg-[#F2F6F7] text-stone-400 border-[#D2DFE2]'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Step 1</span>
              <span className="text-xs font-serif font-bold">Date & Time</span>
            </div>

            <div className={`p-2.5 rounded-2xl border text-center transition-all ${
              currentStep === 2 
                ? 'bg-[#10222B] text-white border-[#10222B] shadow-xs' 
                : currentStep > 2
                ? 'bg-[#EBF7F7] text-[#1B8585] border-[#1B8585]/30'
                : 'bg-[#F2F6F7] text-stone-400 border-[#D2DFE2]'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Step 2</span>
              <span className="text-xs font-serif font-bold">Choose Table</span>
            </div>

            <div className={`p-2.5 rounded-2xl border text-center transition-all ${
              currentStep === 3 
                ? 'bg-[#10222B] text-white border-[#10222B] shadow-xs' 
                : 'bg-[#F2F6F7] text-stone-400 border-[#D2DFE2]'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Step 3</span>
              <span className="text-xs font-serif font-bold">Payment & Confirmation</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Date, Time & Party Size */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-[#1B8585]">
                Step 1: Party Details
              </span>
              <h3 className="font-serif font-bold text-xl text-[#10222B]">
                Select Date, Time Slot & Party Size
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Party Size */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Party Size *
                </label>
                <CustomSelect
                  value={String(guests)}
                  onChange={(val) => setGuests(Number(val))}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => ({
                    value: String(n),
                    label: `${n} ${n === 1 ? 'Guest' : 'Guests'}`
                  }))}
                  prefix={<Users className="w-3.5 h-3.5 text-stone-400" />}
                  buttonClassName="bg-[#F2F6F7] hover:bg-white"
                />
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Reservation Date *
                </label>
                <input
                  type="date"
                  required
                  min={getMinReservationDate()}
                  max={getMaxReservationDate()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none shadow-2xs cursor-pointer"
                />
              </div>

              {/* Time Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Time Slot *
                </label>
                <CustomSelect
                  value={time}
                  onChange={(val) => setTime(val)}
                  options={AVAILABLE_TIME_SLOTS.map(slot => ({
                    value: slot,
                    label: slot
                  }))}
                  prefix={<Clock className="w-3.5 h-3.5 text-stone-400" />}
                  buttonClassName="bg-[#F2F6F7] hover:bg-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-stone-600 flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#1B8585] shrink-0" />
              <span>In the next step, our live floor visualizer will display real-time table availability for <strong>{date}</strong> at <strong>{time}</strong>.</span>
            </div>

            <div className="pt-4 border-t border-[#D2DFE2]/60 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3.5 rounded-2xl bg-[#10222B] hover:bg-[#1E3A47] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-warm-md flex items-center gap-2 active:scale-98"
              >
                <span>View Available Tables</span>
                <ArrowRight className="w-4 h-4 text-[#77C7C6]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Live Table Floor Grid Selector */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <TableGridSelector
              selectedDate={date}
              selectedTime={time}
              partySize={guests}
              selectedTableId={selectedTable?.id}
              onSelectTable={handleSelectTable}
            />

            {/* Bottom Selection Review Strip */}
            <div className="p-4 rounded-2xl bg-[#EBF7F7] border border-[#1B8585]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Armchair className="w-5 h-5 text-[#1B8585] shrink-0" />
                <div>
                  <strong className="text-[#10222B] block">
                    {selectedTable ? selectedTable.name : 'No Specific Table Selected (Auto-Assign)'}
                  </strong>
                  <span className="text-stone-500">
                    {selectedTable 
                      ? `${selectedTable.seatingArea} • Fits ${selectedTable.capacity} Guests`
                      : 'Our floor host will assign the best available table in your preferred zone upon arrival.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-stone-700 text-xs font-semibold hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-white text-xs font-bold uppercase tracking-wider shadow-warm-sm flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Continue to Guest Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#77C7C6]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Guest Details, Dual Payment Selection & Final Submit */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-[#1B8585]">
                Step 3: Confirm & Payment
              </span>
              <h3 className="font-serif font-bold text-xl text-[#10222B]">
                Guest Contact Details & Payment Method
              </h3>
            </div>

            {/* Selected Booking Summary Recap */}
            <div className="p-4 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Date</span>
                <strong className="text-[#10222B]">{formatDate(date)}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Time</span>
                <strong className="text-[#10222B]">{time}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Party</span>
                <strong className="text-[#10222B]">{guests} Guests</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Allocated Table</span>
                <strong className="text-[#1B8585]">{selectedTable ? selectedTable.name : `${seatingPreference} (Auto)`}</strong>
              </div>
            </div>

            {/* Guest Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Confirmation Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Dietary Notes or Occasion Details (Optional)
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Celebrating anniversary, quiet corner table appreciated, 1 guest with celiac (GF)."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
              />
            </div>

            {/* Free Reservation Reward Redemption Toggle (If Available) */}
            {freeReservationsAvailable > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-[#EBF7F7] border border-emerald-300/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 block font-bold">
                      🎉 Redeem 1 Free Reservation Reward ({freeReservationsAvailable} Available)
                    </strong>
                    <span className="text-emerald-800">
                      Waives 100% of the booking deposit & 2% service charge.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRedeemingReward(!isRedeemingReward)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isRedeemingReward
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${isRedeemingReward ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{isRedeemingReward ? 'Reward Applied' : 'Redeem Free Booking'}</span>
                </button>
              </div>
            )}

            {/* DUAL PAYMENT METHOD SELECTOR: Pay Online vs Pay at Location */}
            <ReservationPaymentSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
              totalPayable={feeDetails.totalAmount}
              isRewardRedeemed={isRedeemingReward}
              onlineSubMethod={onlineSubMethod}
              onSelectOnlineSubMethod={setOnlineSubMethod}
              cardNumber={cardNumber}
              onCardNumberChange={setCardNumber}
              cardExpiry={cardExpiry}
              onCardExpiryChange={setCardExpiry}
              upiId={upiId}
              onUpiIdChange={setUpiId}
            />

            {/* Itemized 2% Surcharge Checkout Breakdown Card */}
            <div className="p-5 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#10222B] border-b border-[#D2DFE2]/60 pb-2">
                <Receipt className="w-4 h-4 text-[#1B8585]" />
                <span>Itemized Reservation Deposit & Service Charge</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Base Table Booking Deposit ({guests} Guests):</span>
                  <span className="font-mono font-medium">
                    {isRedeemingReward ? <span className="line-through text-stone-400 mr-2">{formatCurrency(Math.max(200, guests * 100))}</span> : null}
                    {formatCurrency(feeDetails.baseFee)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    <span>Convenience & Service Surcharge (2%):</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">2.0%</span>
                  </span>
                  <span className="font-mono font-medium">
                    {isRedeemingReward ? <span className="line-through text-stone-400 mr-2">{formatCurrency(Number((Math.max(200, guests * 100) * 0.02).toFixed(2)))}</span> : null}
                    {formatCurrency(feeDetails.surchargeAmount)}
                  </span>
                </div>

                {isRedeemingReward && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold pt-1 border-t border-dashed border-emerald-200">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>10-Token Loyalty Free Reward:</span>
                    </span>
                    <span>-100% Fee Waiver</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#D2DFE2] font-bold text-[#10222B] text-sm">
                <span>Total Amount {paymentMethod === 'at_location' && !isRedeemingReward ? 'Due on Arrival' : 'Payable'}:</span>
                <div className="text-right">
                  <span className={`font-mono text-base ${isRedeemingReward ? 'text-emerald-700 font-bold' : 'text-[#10222B]'}`}>
                    {formatCurrency(feeDetails.totalAmount)}
                  </span>
                  <span className="text-[10px] text-stone-400 block font-normal">
                    {isRedeemingReward ? 'Waived with 10-Token Reward' : 'Deposit credited towards in-cafe dining bill'}
                  </span>
                </div>
              </div>
            </div>

            {/* Token Earning Prompt */}
            <div className="p-3.5 rounded-xl bg-[#EBF7F7] border border-[#1B8585]/30 text-xs text-[#10222B] flex items-center gap-2.5">
              <span className="text-base">☕</span>
              <span>
                {paymentMethod === 'online' || isRedeemingReward 
                  ? 'You will earn +1 Loyalty Token immediately upon payment confirmation!' 
                  : 'You will earn +1 Loyalty Token when your table is seated at the café!'}
              </span>
            </div>

            {/* Navigation & Submit CTA */}
            <div className="pt-4 border-t border-[#D2DFE2]/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-3 rounded-xl bg-white border border-[#D2DFE2] text-stone-700 text-xs font-semibold hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Floor Plan</span>
              </button>

              <button
                type="submit"
                disabled={isSyncing}
                className="px-8 py-3.5 rounded-2xl bg-[#10222B] text-[#F2F6F7] font-bold text-xs uppercase tracking-wider hover:bg-[#1E3A47] active:scale-98 transition-all shadow-warm-md flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#77C7C6]" />
                <span>
                  {isSyncing 
                    ? 'Processing Reservation...' 
                    : isRedeemingReward 
                    ? 'Confirm Free Table Booking' 
                    : paymentMethod === 'online'
                    ? `Pay ${formatCurrency(feeDetails.totalAmount)} & Confirm Online`
                    : `Confirm Reservation (Pay ${formatCurrency(feeDetails.totalAmount)} at Venue)`}
                </span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Logged In Customer's Bookings Ledger */}
      {userBookings.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D2DFE2] shadow-warm-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#D2DFE2]/60 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#1B8585]" />
              <h3 className="font-serif font-bold text-lg text-[#10222B]">
                Your Reservation Requests ({userBookings.length})
              </h3>
            </div>
            <span className="text-xs text-stone-500">Live floor status updates</span>
          </div>

          <div className="space-y-3">
            {userBookings.map((b) => {
              const getCustomerStatusLabel = (status: Reservation['status']) => {
                switch (status) {
                  case 'pending':
                    return { label: 'Pending Staff Approval', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
                  case 'confirmed':
                    return { label: 'Confirmed & Reserved', color: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600' };
                  case 'seated':
                    return { label: `Seated ${b.tableName ? `at ${b.tableName}` : ''}`, color: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-600' };
                  case 'dining':
                    return { label: `Dining ${b.tableName ? `at ${b.tableName}` : ''}`, color: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-600 animate-pulse' };
                  case 'billed':
                    return { label: 'Check Dropped (Settling Bill)', color: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-600' };
                  case 'completed':
                    return { label: 'Completed (Thank You!)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' };
                  case 'no_show':
                    return { label: 'No-Show', color: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-600' };
                  case 'cancelled':
                  default:
                    return { label: 'Cancelled', color: 'bg-stone-100 text-stone-700 border-stone-300', dot: 'bg-stone-400' };
                }
              };

              const statusMeta = getCustomerStatusLabel(b.status);

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm text-[#10222B]">
                        {formatDate(b.date)} at {b.time}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="font-semibold text-stone-700">{b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}</span>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-600">{b.seatingPreference}</span>
                      {b.tableName && (
                        <span className="text-[#1B8585] font-bold">({b.tableName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono flex-wrap">
                      <span>ID: {b.id}</span>
                      {b.isFreeRewardRedeemed ? (
                        <span className="text-emerald-700 font-semibold font-sans">🎁 Free 10-Token Reward</span>
                      ) : b.paymentMethod === 'online' ? (
                        <span className="text-blue-700 font-semibold font-sans">💳 Paid Online: {formatCurrency(b.totalAmountPaid || 204)}</span>
                      ) : (
                        <span className="text-amber-800 font-semibold font-sans">📍 Pay on Arrival: {formatCurrency(b.totalAmountPaid || 204)}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusMeta.color}`}>
                      <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`}></span>
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
