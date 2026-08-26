import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { useLoyalty } from '../../context/LoyaltyContext';
import { useAuth } from '../../context/AuthContext';
import { Reservation, ReservationStatus, CafeTable, SeatingArea } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { exportReservationsToCSV } from '../../utils/exportCsv';
import { 
  CalendarDays, 
  Phone, 
  Mail, 
  Check, 
  X, 
  Armchair, 
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Utensils,
  LayoutGrid,
  List,
  Sparkles,
  Users,
  Timer,
  ChevronDown,
  Banknote
} from 'lucide-react';

const STATUS_LABELS: Record<ReservationStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600'
  },
  seated: {
    label: 'Seated',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-600'
  },
  dining: {
    label: 'Dining',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-600'
  },
  billed: {
    label: 'Check Dropped (Billed)',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-600'
  },
  completed: {
    label: 'Completed & Cleared',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-300',
    dot: 'bg-stone-400'
  },
  no_show: {
    label: 'No-Show',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600'
  }
};

export const ReservationsManager: React.FC = () => {
  const { 
    reservations, 
    tables, 
    updateStatus, 
    deleteReservation, 
    clearAllReservations, 
    stats 
  } = useReservation();

  const { customersList, refreshCustomers } = useAuth();
  const { adminAdjustUserTokens } = useLoyalty();

  const [activeView, setActiveView] = useState<'list' | 'floor_plan'>('list');
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
  const [selectedSeatingArea, setSelectedSeatingArea] = useState<string>('All Areas');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<'all' | 'paid' | 'pending_at_venue' | 'waived'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Table Seating Modal State
  const [seatingModalReservation, setSeatingModalReservation] = useState<Reservation | null>(null);
  const [chosenTableId, setChosenTableId] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredReservations = reservations.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (selectedSeatingArea !== 'All Areas' && r.seatingPreference !== selectedSeatingArea) return false;
    if (selectedPaymentFilter !== 'all') {
      const pStatus = r.paymentStatus || (r.isFreeRewardRedeemed ? 'waived' : 'paid');
      if (pStatus !== selectedPaymentFilter) return false;
    }
    return true;
  });

  const handleExport = () => {
    exportReservationsToCSV(reservations);
    showToast('Exported reservation records to CSV successfully.');
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all reservation records? This will permanently remove all booking tickets and release occupied tables.')) {
      await clearAllReservations();
      showToast('All reservation records cleared and all tables reset to available.');
    }
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if (window.confirm(`Permanently remove booking ticket for ${name}?`)) {
      await deleteReservation(id);
      showToast(`Reservation for ${name} removed.`);
    }
  };

  const handleAdjustCustomerToken = async (email: string, delta: number) => {
    const res = await adminAdjustUserTokens(email, delta);
    if (res) {
      await refreshCustomers();
      showToast(`Updated token balance for ${email} (${delta > 0 ? `+${delta}` : delta}). Current: ${res.newBalance}/10 Tokens.`);
    }
  };

  const handleCollectVenuePayment = async (reservation: Reservation) => {
    // Award the customer token if not already awarded
    if (reservation.email) {
      await adminAdjustUserTokens(reservation.email, 1, 'Earned +1 Token on venue arrival payment');
      await refreshCustomers();
    }
    await updateStatus(reservation.id, reservation.status === 'pending' ? 'confirmed' : reservation.status);
    showToast(`Collected venue deposit for ${reservation.customerName}. Payment recorded as PAID & +1 Token awarded!`);
  };

  const handleQuickStatusChange = async (
    reservation: Reservation, 
    newStatus: ReservationStatus, 
    tableId?: string | null, 
    tableName?: string | null
  ) => {
    await updateStatus(reservation.id, newStatus, tableId, tableName);

    if (newStatus === 'seated') {
      showToast(`${reservation.customerName} seated at ${tableName || reservation.tableName || 'table'}. Table is now Occupied.`);
    } else if (newStatus === 'dining') {
      showToast(`${reservation.customerName} marked as Dining.`);
    } else if (newStatus === 'billed') {
      showToast(`Check dropped for ${reservation.customerName} (${reservation.tableName || 'Table'}). Status updated to Billed.`);
    } else if (newStatus === 'completed') {
      showToast(`${reservation.customerName} completed dining. ${reservation.tableName || 'Table'} is now CLEARED & AVAILABLE.`);
    } else if (newStatus === 'cancelled' || newStatus === 'no_show') {
      showToast(`Booking for ${reservation.customerName} marked as ${newStatus === 'no_show' ? 'No-Show' : 'Cancelled'}.`);
    } else if (newStatus === 'confirmed') {
      showToast(`Booking for ${reservation.customerName} confirmed.`);
    }
  };

  const openSeatingModal = (res: Reservation) => {
    setSeatingModalReservation(res);
    // Suggest first available table matching seating preference and guest count
    const suggested = tables.find(t => 
      t.status === 'available' && 
      (t.seatingArea === res.seatingPreference || !res.seatingPreference) && 
      t.capacity >= res.guests
    ) || tables.find(t => t.status === 'available') || tables[0];
    
    setChosenTableId(suggested ? suggested.id : '');
  };

  const handleConfirmSeating = async () => {
    if (!seatingModalReservation || !chosenTableId) return;
    const selectedTable = tables.find(t => t.id === chosenTableId);
    if (!selectedTable) return;

    await updateStatus(
      seatingModalReservation.id, 
      'seated', 
      selectedTable.id, 
      selectedTable.name
    );

    showToast(`${seatingModalReservation.customerName} seated at ${selectedTable.name}. Table marked as Occupied.`);
    setSeatingModalReservation(null);
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const meta = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text} border ${meta.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${status === 'pending' || status === 'dining' ? 'animate-pulse' : ''}`}></span>
        {meta.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#10222B] text-white text-xs font-semibold shadow-2xl border border-[#1B8585] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#77C7C6] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & KPI Controls */}
      <div className="bg-[#10222B] p-6 sm:p-8 rounded-3xl border border-[#1E3A47] text-white shadow-warm-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-[#152A35] text-[#77C7C6] text-xs font-bold uppercase tracking-wider border border-[#1E3A47]">
              Floor & Host Operations
            </span>
            <span className="text-xs text-stone-400">
              {tables.length} Total Tables ({stats.availableTablesCount} Available, {stats.occupiedTablesCount} Occupied)
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Table Management & Live Dining Lifecycle
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            Manage reservations seamlessly from arrival through seating, dining, bill dropping, and table clearance.
          </p>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* View Mode Toggle */}
          <div className="p-1 bg-[#152A35] rounded-2xl border border-[#1E3A47] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'list'
                  ? 'bg-[#1B8585] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Bookings List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('floor_plan')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'floor_plan'
                  ? 'bg-[#1B8585] text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Table Floor Plan</span>
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={reservations.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#77C7C6]" />
            <span>Export CSV</span>
          </button>

          {reservations.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white text-xs font-semibold transition-colors border border-rose-500/30"
              title="Clear all reservations permanently"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Pending Review</span>
          <div className="font-serif font-bold text-2xl text-amber-700 mt-1">{stats.pending}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Confirmed Bookings</span>
          <div className="font-serif font-bold text-2xl text-blue-700 mt-1">{stats.confirmed}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Seated & Dining</span>
          <div className="font-serif font-bold text-2xl text-purple-700 mt-1">{stats.seated + stats.dining}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Checks Dropped (Billed)</span>
          <div className="font-serif font-bold text-2xl text-amber-800 mt-1">{stats.billed}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Completed & Cleared</span>
          <div className="font-serif font-bold text-2xl text-emerald-700 mt-1">{stats.completed}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-warm-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Avg Turn Duration</span>
          <div className="font-serif font-bold text-2xl text-[#10222B] mt-1">{stats.averageTurnDurationMinutes} <span className="text-xs font-sans text-stone-400">mins</span></div>
        </div>

      </div>

      {/* VIEW MODE 1: Table Floor Plan & Live Occupancy */}
      {activeView === 'floor_plan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2DFE2]/60">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#10222B]">
                  Interactive Table Floor Plan
                </h3>
                <p className="text-xs text-stone-500">
                  Live occupancy status across Indoor Main Lounge, Sunlit Garden Patio, and Private Tasting Nook.
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                </span>
                <span className="flex items-center gap-1.5 font-medium text-purple-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Occupied / Seated
                </span>
                <span className="flex items-center gap-1.5 font-medium text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Check Dropped
                </span>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => {
                const isOccupied = table.status === 'occupied' || table.status === 'dining';
                const isBilled = table.status === 'billed';
                const isAvailable = table.status === 'available';

                // Find matching reservation
                const linkedRes = reservations.find(r => r.tableId === table.id && (r.status === 'seated' || r.status === 'dining' || r.status === 'billed'));

                return (
                  <div
                    key={table.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isOccupied
                        ? 'bg-purple-50/70 border-purple-200 shadow-warm-xs'
                        : isBilled
                        ? 'bg-amber-50 border-amber-300 shadow-warm-xs'
                        : 'bg-white border-[#D2DFE2] hover:border-[#1B8585] shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-base text-[#10222B]">
                          {table.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isBilled
                            ? 'bg-amber-200 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {table.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="truncate">{table.seatingArea}</span>
                        <span className="font-mono font-semibold">{table.capacity} Guests</span>
                      </div>

                      {/* Active Guest Info */}
                      {(isOccupied || isBilled) && (
                        <div className="p-3 rounded-xl bg-white/80 border border-black/5 space-y-1 text-xs">
                          <div className="font-bold text-[#10222B] truncate">
                            {table.currentCustomerName || linkedRes?.customerName || 'Guest'}
                          </div>
                          {table.seatedAt && (
                            <div className="text-[11px] text-stone-500 flex items-center gap-1">
                              <Timer className="w-3 h-3 text-[#1B8585]" />
                              <span>Seated {formatRelativeTime(table.seatedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Table Quick Actions */}
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                      {isAvailable ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ready for Guests
                        </span>
                      ) : isOccupied ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => linkedRes && handleQuickStatusChange(linkedRes, 'billed')}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors text-center"
                          >
                            Drop Check
                          </button>
                          <button
                            type="button"
                            onClick={() => linkedRes && handleQuickStatusChange(linkedRes, 'completed')}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors text-center"
                          >
                            Clear Table
                          </button>
                        </div>
                      ) : isBilled ? (
                        <button
                          type="button"
                          onClick={() => linkedRes && handleQuickStatusChange(linkedRes, 'completed')}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors text-center shadow-xs"
                        >
                          ✅ Paid & Clear Table
                        </button>
                      ) : null}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Reservations Ledger List */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: stats.total },
                { id: 'pending', label: 'Pending', count: stats.pending },
                { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
                { id: 'seated', label: 'Seated / Dining', count: stats.seated + stats.dining },
                { id: 'billed', label: 'Billed', count: stats.billed },
                { id: 'completed', label: 'Completed', count: stats.completed },
                { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
              ].map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#10222B] text-[#F2F6F7] shadow-xs'
                        : 'bg-[#F2F6F7] text-stone-700 hover:bg-[#E5ECEE]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-[#1E3A47] text-[#77C7C6]' : 'bg-white text-stone-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Area & Payment Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <select
                value={selectedSeatingArea}
                onChange={(e) => setSelectedSeatingArea(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:outline-none focus:bg-white focus:border-[#1B8585]"
              >
                <option value="All Areas">All Seating Areas</option>
                <option value="Indoor Main Lounge">Indoor Main Lounge</option>
                <option value="Sunlit Garden Patio">Sunlit Garden Patio</option>
                <option value="Private Tasting Nook">Private Tasting Nook</option>
              </select>

              <select
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:outline-none focus:bg-white focus:border-[#1B8585]"
              >
                <option value="all">All Payments</option>
                <option value="paid">💳 Paid Online</option>
                <option value="pending_at_venue">📍 Pay at Venue</option>
                <option value="waived">🎁 10-Token Reward</option>
              </select>
            </div>

          </div>

          {/* Booking Cards List */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="bg-white p-16 rounded-3xl border border-[#D2DFE2] text-center text-stone-400 font-medium space-y-2">
                <CalendarDays className="w-10 h-10 text-stone-300 mx-auto" />
                <p>No reservations match the selected filter.</p>
              </div>
            ) : (
              filteredReservations.map((res) => {
                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D2DFE2]/80 shadow-warm-sm space-y-5 hover:shadow-warm-md transition-shadow"
                  >
                    {/* Header: Guest Info & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2DFE2]/60">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center font-bold font-serif text-base shadow-xs shrink-0">
                          {res.guests}p
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif font-bold text-lg text-[#10222B]">
                              {res.customerName}
                            </h4>
                            {res.tableName && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-[#E5ECEE] text-[#1B8585] text-xs font-bold border border-[#D2DFE2]">
                                📍 {res.tableName}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-stone-400">
                            ID: {res.id} • Booked {formatRelativeTime(res.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Payment Badge + Status Badge & Direct Status Override Dropdown */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Payment Pill */}
                        {res.isFreeRewardRedeemed || res.paymentStatus === 'waived' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>10-Token Reward</span>
                          </span>
                        ) : res.paymentStatus === 'pending_at_venue' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pay at Venue</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            <span>Paid Online</span>
                          </span>
                        )}

                        {getStatusBadge(res.status)}

                        {/* Interactive Status Selector Dropdown */}
                        <div className="relative inline-block">
                          <select
                            value={res.status}
                            onChange={(e) => handleQuickStatusChange(res, e.target.value as ReservationStatus)}
                            className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-700 border border-[#D2DFE2] focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="seated">Seated</option>
                            <option value="dining">Dining</option>
                            <option value="billed">Billed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No-Show</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-stone-700 bg-[#F2F6F7] p-4 rounded-2xl border border-[#D2DFE2]/60">
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="w-4 h-4 text-[#1B8585]" />
                        <span><strong>{formatDate(res.date)}</strong> at <strong>{res.time}</strong></span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Armchair className="w-4 h-4 text-[#1B8585]" />
                        <span>{res.seatingPreference}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-[#1B8585]" />
                        <a href={`tel:${res.phone}`} className="hover:text-[#1B8585] font-semibold">{res.phone}</a>
                      </div>

                      <div className="flex items-center gap-2.5 truncate">
                        <Mail className="w-4 h-4 text-[#1B8585]" />
                        <a href={`mailto:${res.email}`} className="hover:text-[#1B8585] truncate">{res.email}</a>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {res.specialRequests && (
                      <p className="text-xs text-stone-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                        <strong>Special Requests:</strong> "{res.specialRequests}"
                      </p>
                    )}

                    {/* Lifecycle Turn Duration Summary on Completed */}
                    {res.status === 'completed' && res.turnDurationMinutes && (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
                        <Timer className="w-4 h-4 text-emerald-600" />
                        <span>Table Turn Time: <strong>{res.turnDurationMinutes} minutes</strong> from Seated to Cleared</span>
                      </div>
                    )}

                    {/* Billing Deposit & 2% Surcharge Breakdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#F2F6F7] p-3.5 rounded-2xl border border-[#D2DFE2]/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-700">Billing:</span>
                        {res.isFreeRewardRedeemed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                            <span>🎁 10-Token Reward Waived (₹0.00)</span>
                          </span>
                        ) : (
                          <span className="text-stone-600">
                            Deposit: <strong>{formatCurrency(res.baseFee || 200)}</strong> + Surcharge (2%): <strong>{formatCurrency(res.surchargeAmount || 4)}</strong> = <strong className="text-[#10222B]">{formatCurrency(res.totalAmountPaid || 204)}</strong>
                          </span>
                        )}
                      </div>

                      {/* Customer Loyalty Token Ledger & Quick Adjust Buttons */}
                      {(() => {
                        const matchingCustomer = customersList.find(c => c.email?.toLowerCase() === res.email?.toLowerCase());
                        const currentTokens = matchingCustomer?.tokenBalance ?? 0;
                        const currentFree = matchingCustomer?.freeReservationsAvailable ?? 0;

                        return (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D2DFE2] text-stone-700 font-medium">
                              ☕ <strong>{currentTokens}/10 Tokens</strong>
                              {currentFree > 0 && <span className="text-emerald-700 font-bold ml-1">({currentFree} Free)</span>}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustCustomerToken(res.email, 1)}
                                className="px-2 py-0.5 rounded-md bg-[#10222B] text-white hover:bg-[#1E3A47] text-[11px] font-bold shadow-2xs"
                                title="Credit +1 Token"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCustomerToken(res.email, -1)}
                                disabled={currentTokens <= 0}
                                className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 hover:bg-stone-300 disabled:opacity-40 text-[11px] font-bold"
                                title="Debit -1 Token"
                              >
                                -1
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Active Host Lifecycle Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D2DFE2]/40">
                      
                      <button
                        onClick={() => handleDeleteSingle(res.id, res.customerName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors"
                        title="Delete reservation ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Ticket</span>
                      </button>

                      {/* Dynamic Action Buttons per Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* 1. Pending State Actions */}
                        {res.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'confirmed')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve & Confirm</span>
                            </button>
                            <button
                              onClick={() => openSeatingModal(res)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B8585] text-white text-xs font-bold hover:bg-[#146868] transition-colors shadow-xs"
                            >
                              <Armchair className="w-4 h-4" />
                              <span>Seat Immediately</span>
                            </button>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'cancelled')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-medium transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {/* 2. Confirmed State Actions */}
                        {res.status === 'confirmed' && (
                          <>
                            {res.paymentStatus === 'pending_at_venue' && (
                              <button
                                onClick={() => handleCollectVenuePayment(res)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
                                title="Collect cash/card at front counter and award token"
                              >
                                <Banknote className="w-4 h-4" />
                                <span>Collect Venue Deposit ({formatCurrency(res.totalAmountPaid || 204)})</span>
                              </button>
                            )}

                            <button
                              onClick={() => openSeatingModal(res)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B8585] text-white text-xs font-bold hover:bg-[#146868] transition-colors shadow-xs"
                            >
                              <Armchair className="w-4 h-4" />
                              <span>Seat Guest at Table</span>
                            </button>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'no_show')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors border border-amber-200"
                            >
                              <span>Mark No-Show</span>
                            </button>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'cancelled')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-medium transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {/* 3. Seated State Actions */}
                        {res.status === 'seated' && (
                          <>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'dining')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-200 transition-colors"
                            >
                              <Utensils className="w-4 h-4 text-indigo-600" />
                              <span>Mark Dining</span>
                            </button>

                            <button
                              onClick={() => handleQuickStatusChange(res, 'billed')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-colors"
                            >
                              <CreditCard className="w-4 h-4 text-amber-700" />
                              <span>Drop Check (Bill)</span>
                            </button>

                            <button
                              onClick={() => handleQuickStatusChange(res, 'completed')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Clear & Free Table</span>
                            </button>
                          </>
                        )}

                        {/* 4. Dining State Actions */}
                        {res.status === 'dining' && (
                          <>
                            <button
                              onClick={() => handleQuickStatusChange(res, 'billed')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-colors"
                            >
                              <CreditCard className="w-4 h-4 text-amber-700" />
                              <span>Drop Check (Bill)</span>
                            </button>

                            <button
                              onClick={() => handleQuickStatusChange(res, 'completed')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Clear & Free Table</span>
                            </button>
                          </>
                        )}

                        {/* 5. Billed State Actions */}
                        {res.status === 'billed' && (
                          <button
                            onClick={() => handleQuickStatusChange(res, 'completed')}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✅ Paid & Mark Table Cleared</span>
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SEATING MODAL: Pick a Table for Reservation */}
      {seatingModalReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#D2DFE2] space-y-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D2DFE2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E5ECEE] text-[#1B8585] flex items-center justify-center">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#10222B]">Seat Reservation</h3>
                  <p className="text-xs text-stone-500">{seatingModalReservation.customerName} ({seatingModalReservation.guests} Guests)</p>
                </div>
              </div>

              <button
                onClick={() => setSeatingModalReservation(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Assign to Table:
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {tables.map(table => {
                  const isAvail = table.status === 'available';
                  const isSelected = chosenTableId === table.id;

                  return (
                    <div
                      key={table.id}
                      onClick={() => isAvail && setChosenTableId(table.id)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        !isAvail
                          ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#E5ECEE] border-[#1B8585] shadow-xs cursor-pointer'
                          : 'bg-[#F2F6F7] border-[#D2DFE2] hover:bg-white cursor-pointer'
                      }`}
                    >
                      <div>
                        <strong className="font-serif text-xs text-[#10222B] block">{table.name}</strong>
                        <span className="text-[10px] text-stone-500 font-mono">{table.seatingArea} • Cap: {table.capacity}p</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {table.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#D2DFE2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSeatingModalReservation(null)}
                className="px-4 py-2 rounded-xl text-stone-600 text-xs font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!chosenTableId}
                onClick={handleConfirmSeating}
                className="px-5 py-2.5 rounded-xl bg-[#1B8585] hover:bg-[#146868] text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50"
              >
                Confirm Seating & Mark Table Occupied
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
