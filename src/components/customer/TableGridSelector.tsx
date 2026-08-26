import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { CafeTable, SeatingArea } from '../../types';
import { 
  Armchair, 
  Sun, 
  Coffee, 
  Sparkles, 
  Check, 
  Users, 
  Info, 
  AlertCircle,
  Clock,
  MapPin,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface TableGridSelectorProps {
  selectedDate: string;
  selectedTime: string;
  partySize: number;
  selectedTableId?: string | null;
  onSelectTable: (table: CafeTable) => void;
}

export const TableGridSelector: React.FC<TableGridSelectorProps> = ({
  selectedDate,
  selectedTime,
  partySize,
  selectedTableId,
  onSelectTable
}) => {
  const { tables, getBookedTableIds } = useReservation();
  const [activeZone, setActiveZone] = useState<string>('All');

  const bookedTableIds = getBookedTableIds(selectedDate, selectedTime);

  const zones = ['All', 'Indoor Main Lounge', 'Sunlit Garden Patio', 'Private Tasting Nook'];

  const filteredTables = tables.filter(table => {
    if (activeZone !== 'All' && table.seatingArea !== activeZone) return false;
    return true;
  });

  const availableCount = tables.filter(t => 
    !bookedTableIds.includes(t.id) && t.capacity >= partySize
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Bar: Zone Filter & Live Availability Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2DFE2]/60">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#1B8585] block">
            Step 2: Choose Your Table
          </span>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#10222B] mt-0.5">
            Interactive Floor & Table Selector
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Real-time availability for <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong> ({partySize} {partySize === 1 ? 'Guest' : 'Guests'})
          </p>
        </div>

        {/* Real-Time Available Count Badge */}
        <div className="flex items-center gap-2 bg-[#E5ECEE] text-[#10222B] px-3.5 py-1.5 rounded-2xl border border-[#D2DFE2] text-xs shrink-0 self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span><strong>{availableCount}</strong> of {tables.length} Tables Available</span>
        </div>
      </div>

      {/* Legend & Visual Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F6F7] p-3.5 rounded-2xl border border-[#D2DFE2]/60 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#1B8585]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B8585] ring-2 ring-[#77C7C6]"></span> Selected
          </span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span> Booked for Slot
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Exceeds Capacity
          </span>
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          🔒 Real-Time Collision Protection
        </span>
      </div>

      {/* Zone Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {zones.map(zone => (
          <button
            key={zone}
            type="button"
            onClick={() => setActiveZone(zone)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeZone === zone
                ? 'bg-[#10222B] text-white border-[#10222B] shadow-xs'
                : 'bg-white text-stone-600 border-[#D2DFE2] hover:bg-[#F2F6F7]'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Tables Floor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(table => {
          const isBooked = bookedTableIds.includes(table.id);
          const isTooSmall = table.capacity < partySize;
          const isSelected = selectedTableId === table.id;
          const isSelectable = !isBooked && !isTooSmall;

          return (
            <div
              key={table.id}
              onClick={() => isSelectable && onSelectTable(table)}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 text-left relative overflow-hidden ${
                isSelected
                  ? 'bg-[#EBF7F7] border-[#1B8585] ring-2 ring-[#1B8585]/40 shadow-warm-md scale-[1.01]'
                  : isBooked
                  ? 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed grayscale-[40%]'
                  : isTooSmall
                  ? 'bg-amber-50/40 border-amber-200/80 opacity-75 cursor-not-allowed'
                  : 'bg-white border-[#D2DFE2] hover:border-[#1B8585] hover:shadow-warm-sm cursor-pointer active:scale-98'
              }`}
            >
              <div className="space-y-2.5">
                
                {/* Top Row: Table Code + Zone Badge + Selection Check */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#10222B] text-[#77C7C6] font-mono text-[11px] font-bold shadow-xs">
                      {table.tableNumber || table.id}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {table.zone || table.seatingArea.split(' ')[0]}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-[#1B8585] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : isBooked ? (
                    <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 text-[10px] font-bold uppercase">
                      Reserved
                    </span>
                  ) : isTooSmall ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Max {table.capacity}p
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      Available
                    </span>
                  )}
                </div>

                {/* Table Name & Seating Area */}
                <div>
                  <h4 className="font-serif font-bold text-base text-[#10222B] leading-tight">
                    {table.name}
                  </h4>
                  <span className="text-xs text-stone-500 font-medium">
                    {table.seatingArea}
                  </span>
                </div>

                {/* Capacity Pill */}
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Users className="w-3.5 h-3.5 text-[#1B8585]" />
                  <span>Seats <strong>{table.minCapacity || 1} to {table.capacity} Guests</strong></span>
                </div>

                {/* Table Perks / Ambient Notes */}
                {table.perks && table.perks.length > 0 && (
                  <div className="pt-2 border-t border-black/5 space-y-1">
                    {table.perks.slice(0, 2).map((perk, idx) => (
                      <div key={idx} className="text-[11px] text-stone-500 flex items-center gap-1.5 truncate">
                        <span className="text-[#1B8585] text-xs">✦</span>
                        <span className="truncate">{perk}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Action Prompt */}
              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                {isBooked ? (
                  <span className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Booked for {selectedTime}
                  </span>
                ) : isTooSmall ? (
                  <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Party of {partySize} exceeds table capacity
                  </span>
                ) : isSelected ? (
                  <span className="text-[11px] text-[#1B8585] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected Table
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400 group-hover:text-[#1B8585] font-semibold">
                    Click to select this table →
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
