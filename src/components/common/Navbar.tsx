import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  CalendarDays, 
  Clock, 
  Menu as MenuIcon, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  LogOut, 
  User, 
  Waves 
} from 'lucide-react';
import { getCafeLiveStatus } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';
import { CafeStatus } from '../../types';
import { HappyHourBanner } from './HappyHourBanner';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<CafeStatus>(getCafeLiveStatus());
  const [isScrolled, setIsScrolled] = useState(false);

  // Update cafe live status every 30 seconds
  useEffect(() => {
    const update = () => setLiveStatus(getCafeLiveStatus());
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Artisan Menu', path: '/menu' },
    { name: 'Our Story', path: '/about' },
    { name: 'Visual Gallery', path: '/gallery' },
    { name: 'Contact & Hours', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isOperationsUser = user && (user.role === 'admin' || user.role === 'staff');

  return (
    <>
      {/* Dynamic Zero-Waste Happy Hour Alert */}
      <HappyHourBanner />

      {/* Top micro-announcement banner (Pacific Drip Slate) */}
      <div className="bg-[#10222B] text-[#F2F6F7] text-xs py-1.5 px-4 border-b border-[#1E3A47]/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[#3BAFA9] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#77C7C6]" />
              Pacific Single-Origin:
            </span>
            <span className="text-stone-300 truncate">Ethiopia Yirgacheffe Washed & Cold Brew on tap</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Open / Closed dynamic indicator */}
            <div 
              className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/15 text-[11px]"
              title={liveStatus.nextTransition}
            >
              <span className={`w-2 h-2 rounded-full ${liveStatus.isOpen ? 'bg-[#3BAFA9] animate-pulse shadow-[0_0_8px_#3BAFA9]' : 'bg-rose-400'}`}></span>
              <span className="font-bold text-white">{liveStatus.isOpen ? '🟢 Open Now' : '🔴 Closed'}</span>
              <span className="text-white/40">•</span>
              <span className="text-stone-300 font-medium">{liveStatus.nextTransition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Bar (Ocean Fog Canvas) */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F6F9FA]/95 backdrop-blur-md shadow-warm-md border-b border-[#D2DFE2]/70 py-3'
            : 'bg-[#F6F9FA] border-b border-[#D2DFE2]/40 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A47] to-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-warm-sm group-hover:scale-105 transition-transform duration-200 border border-[#1B8585]/40">
              <Coffee className="w-5 h-5 text-[#77C7C6]" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#10222B] block leading-none">
                AURA
              </span>
              <span className="text-[10px] tracking-[0.25em] font-semibold text-[#1B8585] uppercase block mt-0.5">
                Coffee & Kitchen
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'text-[#1B8585] bg-[#E5ECEE] font-semibold shadow-xs'
                      : 'text-[#1E3A47] hover:text-[#1B8585] hover:bg-[#EEF4F6]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Reservations CTA & Auth Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              to="/reservations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#10222B] text-[#F2F6F7] hover:bg-[#1E3A47] active:scale-95 transition-all shadow-warm-sm hover:shadow-warm-md"
            >
              <CalendarDays className="w-4 h-4 text-[#77C7C6]" />
              <span>Book Table</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#D2DFE2]">
                {/* Operations Suite Button ONLY for Admin & Staff */}
                {isOperationsUser ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F2F6F7] text-[#10222B] hover:bg-[#E5ECEE] border border-[#D2DFE2] transition-colors"
                    title="Go to Operations Dashboard"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#1B8585]" />
                    <span className="font-semibold">Operations</span>
                    <span className="px-1.5 py-0.2 bg-[#10222B] text-[#77C7C6] text-[10px] rounded uppercase font-mono">
                      {user.role}
                    </span>
                  </Link>
                ) : (
                  /* Customer Member Status Pill */
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B]">
                    <div className="w-5 h-5 rounded-full bg-[#10222B] text-[#77C7C6] flex items-center justify-center text-[10px] font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium truncate max-w-[120px]">{user.displayName || user.email?.split('@')[0]}</span>
                  </div>
                )}

                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1E3A47] hover:text-[#10222B] hover:bg-[#F2F6F7] border border-transparent hover:border-[#D2DFE2] transition-all"
                title="Member & Staff Login"
              >
                <ShieldCheck className="w-4 h-4 text-[#1B8585]" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/reservations"
              className="px-3 py-1.5 rounded-lg bg-[#10222B] text-white text-xs font-semibold uppercase"
            >
              Book
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#10222B] hover:bg-[#E5ECEE] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
          <div className="bg-[#F6F9FA] rounded-t-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto border-t border-[#D2DFE2] animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#D2DFE2]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10222B] text-[#77C7C6] flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-lg text-[#10222B]">AURA</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-stone-500 hover:bg-[#E5ECEE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-[#10222B] text-[#F2F6F7]'
                        : 'text-[#10222B] hover:bg-[#E5ECEE]'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#D2DFE2] space-y-3">
              <Link
                to="/reservations"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1B8585] text-white font-semibold text-sm shadow-warm-sm"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Reserve a Table</span>
              </Link>

              {user ? (
                <div className="space-y-2">
                  {/* Operations button shown ONLY for Staff / Admin */}
                  {isOperationsUser && (
                    <Link
                      to="/admin"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F2F6F7] text-[#10222B] font-semibold text-sm border border-[#D2DFE2]"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1B8585]" />
                      <span>Operations Suite ({user.role})</span>
                    </Link>
                  )}

                  {!isOperationsUser && (
                    <div className="p-3 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-center text-xs text-stone-600">
                      Signed in as <strong>{user.displayName || user.email}</strong>
                    </div>
                  )}

                  <button
                    onClick={() => logout()}
                    className="w-full py-2.5 rounded-xl text-rose-600 font-semibold text-sm hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F2F6F7] text-[#10222B] font-semibold text-sm border border-[#D2DFE2]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1B8585]" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
