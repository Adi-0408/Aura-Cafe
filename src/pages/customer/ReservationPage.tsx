import React from 'react';
import { ReservationForm } from '../../components/customer/ReservationForm';
import { CalendarDays, Armchair, Sparkles, Clock, Check, Waves } from 'lucide-react';

export const ReservationPage: React.FC = () => {
  return (
    <div className="py-16 bg-[#F6F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5ECEE] border border-[#D2DFE2] text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            <Waves className="w-3.5 h-3.5" />
            <span>Coastal Dining & Tasting Flights</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#10222B] tracking-tight">
            Reserve Your Table at Aura
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Join us in our ocean-fog lounge, coastal garden patio, or private tasting nook for artisanal coffees, warm viennoiserie, and Pacific botanical brunch.
          </p>
        </div>

        {/* Interactive Reservation Booking Form */}
        <ReservationForm />

        {/* Hospitality Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 text-center">
          <div className="bg-[#F2F6F7] p-5 rounded-2xl border border-[#D2DFE2] space-y-1.5">
            <span className="font-serif font-bold text-sm text-[#10222B] block">Staff Review & Confirmation</span>
            <p className="text-xs text-stone-600">All booking requests are reviewed by our floor team in real-time to guarantee table availability.</p>
          </div>
          <div className="bg-[#F2F6F7] p-5 rounded-2xl border border-[#D2DFE2] space-y-1.5">
            <span className="font-serif font-bold text-sm text-[#10222B] block">Seating Flexibility</span>
            <p className="text-xs text-stone-600">Choose between our quiet coastal patio, velvet main lounge, or private group tasting nook.</p>
          </div>
          <div className="bg-[#F2F6F7] p-5 rounded-2xl border border-[#D2DFE2] space-y-1.5">
            <span className="font-serif font-bold text-sm text-[#10222B] block">Dietary Accommodation</span>
            <p className="text-xs text-stone-600">Full allergy protocols supported: Vegan, Gluten-Free & Dairy-Free.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
