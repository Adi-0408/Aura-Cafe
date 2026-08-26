import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Navigation, CalendarDays, Car, Bike, Sparkles, Waves } from 'lucide-react';
import { getCafeLiveStatus } from '../../utils/date';

export const LocationMap: React.FC = () => {
  const liveStatus = getCafeLiveStatus();

  return (
    <section className="py-20 bg-[#F2F6F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            Find Your Way
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#10222B]">
            Visit Aura Coastal Roastery & Kitchen
          </h2>
          <p className="text-stone-600 text-sm">
            Located on the coastal ridge with open-air garden seating, high-speed Wi-Fi, and handcrafted slow cold drip extractions.
          </p>
        </div>

        {/* Centered Visit Info Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#D2DFE2] shadow-warm-md space-y-8">
          
          {/* Top Status & Address */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D2DFE2]/70">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shrink-0 shadow-sm border border-[#1B8585]/40">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#10222B]">
                  Aura Coffee & Kitchen
                </h3>
                <p className="text-stone-600 text-sm mt-1">
                  482 Coastal Ridge Way, Oceanview Wharf, Carmel-by-the-Sea / Pacific Grove, CA
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] self-start sm:self-center">
              <span className={`w-2 h-2 rounded-full ${liveStatus.isOpen ? 'bg-[#3BAFA9] animate-pulse' : 'bg-rose-500'}`} />
              <span>{liveStatus.statusText}</span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-500">{liveStatus.nextTransition}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-stone-700">
            <div className="bg-[#F2F6F7] p-4 rounded-2xl border border-[#D2DFE2]/70 space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#10222B]">
                <Clock className="w-4 h-4 text-[#1B8585]" />
                <span>Operating Hours</span>
              </div>
              <p className="text-stone-600 text-xs">
                Mon – Sun: 7:00 AM – 9:00 PM<br />
                <span className="text-stone-400 text-[11px]">Kitchen closes at 8:30 PM</span>
              </p>
            </div>

            <div className="bg-[#F2F6F7] p-4 rounded-2xl border border-[#D2DFE2]/70 space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#10222B]">
                <Phone className="w-4 h-4 text-[#1B8585]" />
                <span>Direct Contact</span>
              </div>
              <a href="tel:+15035552872" className="text-xs text-[#1B8585] hover:underline font-semibold block">
                +1 (503) 555-AURA (2872)
              </a>
              <span className="text-stone-400 text-[11px] block">Table & wholesale inquiries</span>
            </div>

            <div className="bg-[#F2F6F7] p-4 rounded-2xl border border-[#D2DFE2]/70 space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#10222B]">
                <Car className="w-4 h-4 text-[#1B8585]" />
                <span>Courtyard Amenities</span>
              </div>
              <p className="text-stone-600 text-xs">
                Free guest parking & bike racks on premises
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <a
              href="https://maps.google.com/?q=Pacific+Coast+Specialty+Coffee"
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-bold uppercase tracking-wider hover:bg-[#1E3A47] transition-colors shadow-warm-sm"
            >
              <Navigation className="w-4 h-4 text-[#77C7C6]" />
              <span>Get Directions</span>
            </a>

            <Link
              to="/reservations"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#1B8585] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#146868] transition-colors shadow-warm-sm"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Reserve a Table</span>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
