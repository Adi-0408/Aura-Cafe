import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Coffee, ShieldAlert, ArrowLeft, CalendarDays } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin', 'staff'],
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FA] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#D2DFE2] border-t-[#1B8585] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine allowed list
  const effectiveAllowedRoles: UserRole[] = requiredRole 
    ? [requiredRole] 
    : allowedRoles;

  // Strict check: if user's role is not in the allowed roles list
  if (!effectiveAllowedRoles.includes(user.role)) {
    if (user.role === 'customer') {
      return (
        <div className="min-h-screen bg-[#F6F9FA] flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#D2DFE2] shadow-warm-xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#0E1D24] text-[#77C7C6] flex items-center justify-center mx-auto border border-[#1B8585]/30 shadow-warm-sm">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Staff & Admin Access Only
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#10222B]">
                Restricted Operations Area
              </h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                You are signed in as <strong className="text-[#10222B]">{user.displayName || user.email}</strong> (Customer Account). Customer accounts do not have clearance to view internal kitchen queues, raw inventory supply, or financial ledgers.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                to="/reservations"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1B8585] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#146868] transition-colors shadow-warm-sm"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Go to Table Reservations</span>
              </Link>

              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F2F6F7] text-[#10222B] text-xs font-bold hover:bg-[#E5ECEE] border border-[#D2DFE2] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Staff trying to access master admin pages (e.g. staff provisioning)
    return (
      <div className="min-h-screen bg-[#F6F9FA] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#D2DFE2] shadow-warm-xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-[#0E1D24] text-[#77C7C6] flex items-center justify-center mx-auto border border-[#1B8585]/30 shadow-warm-sm">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Admin Exclusive
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#10222B]">
              Administrator Clearance Required
            </h2>
            <p className="text-stone-600 text-xs leading-relaxed">
              This area is restricted exclusively to the primary administrator (<strong>adityapatil.4132@gmail.com</strong>).
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/admin"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-bold uppercase tracking-wider hover:bg-[#1E3A47] transition-colors shadow-warm-sm"
            >
              <ArrowLeft className="w-4 h-4 text-[#77C7C6]" />
              <span>Back to Operations Hub</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
