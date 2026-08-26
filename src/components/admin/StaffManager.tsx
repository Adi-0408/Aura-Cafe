import React, { useState } from 'react';
import { useAuth, StaffMember } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  User, 
  Lock,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Calendar,
  Globe,
  Phone,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Armchair,
  Clock
} from 'lucide-react';
import { formatDate } from '../../utils/date';

export const StaffManager: React.FC = () => {
  const { user, isAdmin, staffList, customersList, addStaffMember, removeStaffMember, refreshCustomers } = useAuth();

  const [activeTab, setActiveTab] = useState<'staff' | 'customers'>('staff');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('1001'); // Default staff passcode is 1001
  const [jobTitle, setJobTitle] = useState('Senior Barista');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCustomerUid, setExpandedCustomerUid] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-[#D2DFE2] text-center space-y-4 max-w-lg mx-auto shadow-warm-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#10222B]">Restricted Area</h3>
        <p className="text-xs text-stone-500">
          Only the master administrator (<strong>adityapatil.4132@gmail.com</strong>) has permissions to manage team members and provision staff passcodes.
        </p>
      </div>
    );
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim()) {
      setError('Please provide the full name and email for the staff member.');
      return;
    }

    if (password.length < 4) {
      setError('Passcode must be at least 4 characters long.');
      return;
    }

    try {
      setIsAdding(true);
      await addStaffMember(name.trim(), email.trim(), jobTitle, password.trim());
      setSuccessMsg(`Staff member ${name} created with passcode "${password}"!`);
      setName('');
      setEmail('');
      setPassword('1001');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (staffId: string, staffName: string) => {
    if (window.confirm(`Revoke staff access for ${staffName}? They will no longer be able to log in to the operations counter.`)) {
      await removeStaffMember(staffId);
      setSuccessMsg(`Revoked staff access for ${staffName}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const copyCredentials = (staffEmail: string, pass: string | undefined, id: string) => {
    navigator.clipboard.writeText(`Email: ${staffEmail}\nPasscode: ${pass || '1001'}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomers();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const onlyCustomers = customersList.filter(c => c.role === 'customer');

  const toggleCustomerExpand = (uid: string) => {
    setExpandedCustomerUid(prev => prev === uid ? null : uid);
  };

  const getReservationBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'seated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Seated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              User Directory & Staff Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10222B] text-[#77C7C6] text-[10px] font-bold uppercase tracking-wider font-mono">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage authenticated café staff passcodes and view registered customers with complete reservation history in Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 text-xs font-semibold border border-[#D2DFE2] transition-colors"
            title="Sync latest user records from Firestore database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1B8585] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        </div>
      </div>

      {/* Directory Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D2DFE2] pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-[#10222B] text-[#F2F6F7] shadow-warm-sm'
              : 'bg-white text-stone-600 hover:bg-[#F2F6F7] border border-[#D2DFE2]'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-[#77C7C6]" />
          <span>Staff Team ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'bg-[#10222B] text-[#F2F6F7] shadow-warm-sm'
              : 'bg-white text-stone-600 hover:bg-[#F2F6F7] border border-[#D2DFE2]'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#77C7C6]" />
          <span>Registered Customers & Database ({onlyCustomers.length})</span>
        </button>
      </div>

      {activeTab === 'staff' && (
        <div className="space-y-8 animate-fade-in">
          {/* Master Admin Card */}
          <div className="p-6 rounded-3xl bg-[#10222B] text-white border border-[#1E3A47] shadow-warm-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3A47] to-[#142B37] text-[#77C7C6] flex items-center justify-center font-bold text-xl border border-[#1B8585]/40 shadow-inner">
                AP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-white">
                    Aditya Patil
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#1B8585] text-white text-[10px] font-bold uppercase tracking-wider">
                    Master Administrator
                  </span>
                </div>
                <span className="text-xs text-stone-300 block">General Operations Director & Owner</span>
                <span className="text-[11px] text-stone-400 font-mono block mt-0.5">adityapatil.4132@gmail.com</span>
              </div>
            </div>

            <div className="text-right text-xs text-stone-400 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
              <span>Full System & Financial Clearance</span>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Staff Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-6">
            <div className="border-b border-[#D2DFE2]/60 pb-4">
              <h3 className="font-serif font-bold text-lg text-[#10222B]">
                Add Authorized Staff Member
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Staff members log in via the Login page using their email and the designated passcode.
              </p>
            </div>

            <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Staff Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff.maya@auracoffee.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Job Role / Title
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                >
                  <option value="Senior Barista & Shift Lead">Senior Barista & Shift Lead</option>
                  <option value="Head Baker & Pastry Lead">Head Baker & Pastry Lead</option>
                  <option value="Barista & Roastery Host">Barista & Roastery Host</option>
                  <option value="Kitchen Specialist">Kitchen Specialist</option>
                  <option value="Floor Manager">Floor Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Staff Passcode *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="1001"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono font-bold text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-2.5 px-4 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-warm-sm active:scale-95 flex items-center justify-center gap-1.5 h-[42px]"
              >
                <UserPlus className="w-4 h-4 text-[#77C7C6]" />
                <span>{isAdding ? 'Adding...' : 'Add Member'}</span>
              </button>
            </form>
          </div>

          {/* Staff Members List */}
          <div className="bg-white rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-[#D2DFE2]/60 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#10222B]">
                Active Staff Team ({staffList.length})
              </h3>
              <span className="text-xs text-stone-400">
                Staff members sign in using their registered email and designated passcode
              </span>
            </div>

            <div className="divide-y divide-[#D2DFE2]/50">
              {staffList.map((staff) => (
                <div
                  key={staff.uid}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F2F6F7] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] text-[#1B8585] flex items-center justify-center font-bold text-sm font-serif">
                      {staff.displayName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-[#10222B]">
                          {staff.displayName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          Active Staff
                        </span>
                      </div>
                      <span className="text-xs text-stone-600 block">{staff.jobTitle}</span>
                      <span className="text-[11px] text-stone-400 font-mono block mt-0.5">
                        {staff.email} • Passcode: <strong className="text-stone-700">{staff.password || '1001'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => copyCredentials(staff.email, staff.password, staff.uid)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 text-xs font-semibold border border-[#D2DFE2] transition-colors"
                      title="Copy login details for this staff member"
                    >
                      {copiedId === staff.uid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1B8585]" />}
                      <span>{copiedId === staff.uid ? 'Copied!' : 'Copy Login'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(staff.uid, staff.displayName)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customers & Database Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm overflow-hidden">
            <div className="p-6 border-b border-[#D2DFE2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#10222B]">
                  Registered Customers & Members in Database ({onlyCustomers.length})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Synchronized customer accounts stored in Cloud Firestore (<code className="font-mono text-[#1B8585]">users</code> collection) with real-time reservation history.
                </p>
              </div>
            </div>

            {onlyCustomers.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-2">
                <Users className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-medium">No customer accounts registered yet.</p>
                <span className="text-xs text-stone-400 block">When customers register, log in with Google, or reserve tables, their records and reservation history will sync directly into the Firestore database.</span>
              </div>
            ) : (
              <div className="divide-y divide-[#D2DFE2]/50">
                {onlyCustomers.map((cust) => {
                  const isExpanded = expandedCustomerUid === cust.uid;
                  const reservationsCount = cust.totalReservations || cust.reservationHistory?.length || 0;

                  return (
                    <div key={cust.uid} className="transition-colors">
                      
                      {/* Customer Row */}
                      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F2F6F7]/60">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center font-bold text-base shadow-xs overflow-hidden shrink-0">
                            {cust.photoURL ? (
                              <img src={cust.photoURL} alt={cust.displayName || 'Customer'} className="w-full h-full object-cover" />
                            ) : (
                              <span>{cust.displayName?.charAt(0) || cust.email?.charAt(0)?.toUpperCase() || 'C'}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-serif font-bold text-base text-[#10222B]">
                                {cust.displayName || 'Aura Member'}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase">
                                Customer
                              </span>
                              {cust.provider === 'google.com' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#E5ECEE] text-[#1B8585] text-[10px] font-semibold border border-[#D2DFE2]">
                                  Google Auth
                                </span>
                              )}
                              {reservationsCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-emerald-600" />
                                  {reservationsCount} {reservationsCount === 1 ? 'Booking' : 'Bookings'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-600 mt-1">
                              <span>{cust.email}</span>
                              {cust.phone && (
                                <span className="flex items-center gap-1 text-stone-500 font-semibold">
                                  <Phone className="w-3 h-3 text-[#1B8585]" />
                                  {cust.phone}
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-stone-400 font-mono block mt-0.5">
                              UID: {cust.uid} {cust.createdAt ? `• Registered: ${formatDate(cust.createdAt)}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {reservationsCount > 0 && (
                            <button
                              onClick={() => toggleCustomerExpand(cust.uid)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 text-xs font-semibold border border-[#D2DFE2] transition-colors"
                            >
                              <span>{isExpanded ? 'Hide Bookings' : 'View Bookings'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <span className="px-3 py-1.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] font-mono text-[11px] text-stone-500 hidden sm:inline-block">
                            Firestore Synced
                          </span>
                        </div>
                      </div>

                      {/* Expandable Reservation History Accordion */}
                      {isExpanded && cust.reservationHistory && cust.reservationHistory.length > 0 && (
                        <div className="px-6 pb-6 pt-2 bg-[#F6F9FA] border-t border-[#D2DFE2]/40 space-y-3 animate-fade-in">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-[#1B8585]" />
                            <span>Customer Reservation History ({cust.reservationHistory.length})</span>
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cust.reservationHistory.map((res) => (
                              <div
                                key={res.reservationId}
                                className="p-4 rounded-2xl bg-white border border-[#D2DFE2] shadow-xs space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-serif font-bold text-sm text-[#10222B]">
                                      {formatDate(res.date)} at {res.time}
                                    </span>
                                    <span className="text-stone-400">•</span>
                                    <span className="font-semibold text-stone-700">{res.guests} Guests</span>
                                  </div>
                                  {getReservationBadge(res.status)}
                                </div>

                                <div className="flex items-center gap-2 text-stone-600">
                                  <Armchair className="w-3.5 h-3.5 text-[#1B8585]" />
                                  <span>{res.seatingPreference}</span>
                                </div>

                                {res.specialRequests && (
                                  <p className="text-[11px] italic text-stone-500 bg-amber-50/60 p-2 rounded-xl border border-amber-200/50">
                                    "{res.specialRequests}"
                                  </p>
                                )}

                                <span className="font-mono text-[10px] text-stone-400 block pt-1 border-t border-stone-100">
                                  Ref: {res.reservationId}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
