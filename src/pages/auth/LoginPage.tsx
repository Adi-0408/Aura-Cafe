import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, User, CheckCircle2, Phone } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getRedirectDestination = (userRole?: string) => {
    const rawFrom = (location.state as any)?.from?.pathname;
    if (rawFrom && rawFrom !== '/login') {
      // If a customer is logging in, never send them to an /admin route
      if (userRole === 'customer' && rawFrom.startsWith('/admin')) {
        return '/reservations';
      }
      return rawFrom;
    }
    // Default destination: Admin/Staff go to /admin, Customers go to /reservations
    return userRole === 'customer' ? '/reservations' : '/admin';
  };

  React.useEffect(() => {
    if (user && !loading) {
      const destination = getRedirectDestination(user.role);
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      if (isRegisterMode) {
        if (!name.trim()) {
          setError('Please provide your full name.');
          setSubmitting(false);
          return;
        }
        await registerWithEmail(email, password, name, phone);
        setSuccess('Account created successfully! Redirecting...');
      } else {
        await loginWithEmail(email, password);
      }
      // Note: React.useEffect on [user] handles the verified redirect with proper role check
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await loginWithGoogle();
      // Note: React.useEffect on [user] handles the verified redirect with proper role check
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FA] flex items-center justify-center p-4 sm:p-6 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#D2DFE2] shadow-warm-xl space-y-8 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-warm-sm border border-[#1B8585]/40">
              <Coffee className="w-6 h-6" />
            </div>
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              Aura Member Portal
            </h1>
            <p className="text-stone-500 text-xs mt-1">
              Sign in to access your authorized dashboard and operations suite
            </p>
          </div>
        </div>

        {/* Private Mode Tabs: Sign In / Register */}
        <div className="flex p-1 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2]/60">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isRegisterMode
                ? 'bg-white text-[#10222B] shadow-xs'
                : 'text-stone-600 hover:text-[#10222B]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isRegisterMode
                ? 'bg-white text-[#10222B] shadow-xs'
                : 'text-stone-600 hover:text-[#10222B]'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Private Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@auracoffee.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-stone-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold uppercase tracking-wider transition-all shadow-warm-sm flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{submitting ? 'Authenticating...' : isRegisterMode ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-[#77C7C6]" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D2DFE2]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-400 font-semibold text-[10px]">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F2F6F7] text-[#10222B] text-xs font-semibold border border-[#D2DFE2] transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-semibold text-[#1B8585] hover:text-[#10222B] transition-colors">
            ← Return to Storefront
          </Link>
        </div>

      </div>
    </div>
  );
};
