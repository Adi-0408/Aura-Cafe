import React from 'react';
import { ContactForm } from '../../components/customer/ContactForm';
import { LocationMap } from '../../components/customer/LocationMap';
import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="py-16 bg-[#F6F9FA] space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5ECEE] border border-[#D2DFE2] text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Connect With Us</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#10222B] tracking-tight">
            Get in Touch & Visit
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Have a question about wholesale coffee partnerships, private evening coastal patio buyouts, or job openings on our crew? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Form & FAQ */}
        <ContactForm />

      </div>

      {/* Location Map Section */}
      <LocationMap />
    </div>
  );
};
