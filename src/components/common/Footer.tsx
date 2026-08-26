import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Coffee, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Facebook, 
  Twitter, 
  ShieldCheck,
  Heart,
  Waves
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E1D24] text-[#F2F6F7] pt-16 pb-8 border-t border-[#1E3A47]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-[#1E3A47]/70">
          
          {/* Col 1: Brand & Craft Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#152A35] text-[#77C7C6] flex items-center justify-center border border-[#1B8585]/40">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wide block leading-none text-white">
                  AURA
                </span>
                <span className="text-[10px] tracking-[0.25em] font-semibold text-[#3BAFA9] uppercase block mt-0.5">
                  Coffee & Kitchen
                </span>
              </div>
            </div>

            <p className="text-stone-300 text-sm leading-relaxed max-w-sm">
              A coastal Pacific micro-roastery and culinary haven committed to 100% direct-trade single-origin coffees, cold brew precision, and natural coastal baking.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#152A35] border border-[#1E3A47] flex items-center justify-center text-stone-300 hover:text-[#77C7C6] hover:border-[#1B8585] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#152A35] border border-[#1E3A47] flex items-center justify-center text-stone-300 hover:text-[#77C7C6] hover:border-[#1B8585] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#152A35] border border-[#1E3A47] flex items-center justify-center text-stone-300 hover:text-[#77C7C6] hover:border-[#1B8585] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: NAP-H Details (Name, Address, Phone, Hours) */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#77C7C6] tracking-wide">
              Visit & Contact
            </h3>
            <ul className="space-y-3 text-sm text-stone-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#1B8585] shrink-0 mt-1" />
                <span>
                  <strong>Aura Pacific Roastery</strong><br />
                  482 Coastal Ridge Way, Oceanview Wharf<br />
                  Carmel-by-the-Sea / Pacific Grove, CA
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#1B8585] shrink-0" />
                <a href="tel:+15035552872" className="hover:text-[#77C7C6] underline-offset-2 hover:underline">
                  +1 (503) 555-AURA (2872)
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#1B8585] shrink-0" />
                <a href="mailto:hello@auracoffeeandkitchen.com" className="hover:text-[#77C7C6] underline-offset-2 hover:underline">
                  hello@auracoffeeandkitchen.com
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Operating Hours & Quick Navigation */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#77C7C6] tracking-wide">
              Operating Hours
            </h3>
            <div className="space-y-2 text-sm text-stone-300">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#1B8585] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-white block">Monday – Sunday</span>
                  <span className="text-stone-300">07:00 AM – 09:00 PM</span>
                  <span className="text-xs text-stone-400 block mt-0.5">Kitchen orders close at 08:30 PM daily</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs uppercase tracking-wider text-[#3BAFA9] font-semibold mb-2">Quick Navigation</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
                <Link to="/menu" className="hover:text-[#77C7C6] transition-colors">Seasonal Menu</Link>
                <Link to="/reservations" className="hover:text-[#77C7C6] transition-colors">Book a Table</Link>
                <Link to="/about" className="hover:text-[#77C7C6] transition-colors">Direct-Trade Story</Link>
                <Link to="/gallery" className="hover:text-[#77C7C6] transition-colors">Visual Gallery</Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Copyright & Admin Link */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Aura Coffee & Kitchen LLC. Pacific Coast Roasters.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-stone-200 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-stone-200 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-[#3BAFA9] hover:text-[#77C7C6] font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
