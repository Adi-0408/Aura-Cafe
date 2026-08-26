import React, { useState } from 'react';
import { Mail, Phone, MapPin, ChevronDown, ChevronUp, Sparkles, Clock, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Do you host private events or coastal patio buyouts?',
    a: 'Yes! Our ocean-fog garden patio and brew lounge are available for private evening hire (after 6:00 PM) for cupping workshops, corporate gatherings, and boutique celebrations.'
  },
  {
    q: 'What dairy alternatives do you offer for specialty drinks?',
    a: 'We proudly pour Oatly Barista Edition Oat Milk, Minor Figures Organic Oat M*lk, and Califia Farms Almond Milk. All alt-milks are steamed on dedicated wands to prevent cross-contact.'
  },
  {
    q: 'Can I purchase roasted whole beans in bulk?',
    a: 'Absolutely. We roast fresh twice weekly in small 12kg batches. You can purchase 250g, 1kg, and 5kg whole bean tins directly at our counter.'
  },
  {
    q: 'What are your protocols regarding dietary allergens (Gluten, Nuts)?',
    a: 'While we bake with organic wheat flours daily, our gluten-free and vegan items are prepared with sanitized separation protocols. Please alert our team if you have severe sensitivities.'
  }
];

export const ContactForm: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* FAQ Accordion Section */}
      <div className="space-y-4">
        <div className="text-center space-y-1 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1B8585]">
            <HelpCircle className="w-4 h-4" />
            <span>Common Queries</span>
          </div>
          <h3 className="font-serif text-3xl font-bold text-[#10222B]">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Everything you need to know about our sourcing, reservations, and dietary protocols.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-serif font-bold text-sm sm:text-base text-[#10222B] flex items-center justify-between gap-4 hover:bg-[#F2F6F7] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#1B8585] shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-[#D2DFE2]/60 pt-3 bg-[#F6F9FA]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
