import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { StockFilter } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  ArrowUpRight 
} from 'lucide-react';

interface KpiMetricsProps {
  activeFilter: StockFilter;
  onSelectFilter: (filter: StockFilter) => void;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ activeFilter, onSelectFilter }) => {
  const { stats, inventory } = useInventory();

  const activeItemsCount = inventory.filter(i => !i.isArchived).length;
  const inStockCount = inventory.filter(i => !i.isArchived && i.quantity > i.minThreshold).length;
  const healthPercent = activeItemsCount > 0 
    ? Math.round((inStockCount / activeItemsCount) * 100) 
    : 100;

  const cards = [
    {
      id: 'all' as StockFilter,
      label: 'Catalog Items',
      value: stats.totalSkus,
      subtext: `${inStockCount} Optimal (${healthPercent}% Health)`,
      icon: <Boxes className="w-5 h-5 text-[#1B8585]" />,
      accentColor: 'from-[#10222B] to-[#1E3A47]',
      colorClass: 'text-[#10222B]',
      borderClass: activeFilter === 'all' 
        ? 'border-[#1B8585] ring-2 ring-[#1B8585]/20 bg-gradient-to-b from-white to-[#F2F8F8] shadow-warm-md' 
        : 'border-[#D2DFE2]/80 bg-white hover:border-[#1B8585]/50 hover:shadow-warm-sm',
      bgIcon: 'bg-[#EBF7F7] text-[#1B8585] border border-[#A3DEDE]',
      badge: 'Active Catalog'
    },
    {
      id: 'valuation' as any,
      label: 'Inventory Valuation',
      value: formatCurrency(stats.totalValuation),
      subtext: 'Current Cost Basis on Hand',
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      accentColor: 'from-emerald-600 to-teal-700',
      colorClass: 'text-emerald-950',
      borderClass: 'border-[#D2DFE2]/80 bg-white hover:shadow-warm-sm',
      bgIcon: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      noFilter: true,
      badge: 'Asset Value'
    },
    {
      id: 'low_stock' as StockFilter,
      label: 'Low Stock Warnings',
      value: stats.lowStockCount,
      subtext: 'At or Below Par Threshold',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      accentColor: 'from-amber-500 to-amber-700',
      colorClass: stats.lowStockCount > 0 ? 'text-amber-900' : 'text-stone-700',
      borderClass: activeFilter === 'low_stock' 
        ? 'border-amber-500 ring-2 ring-amber-500/20 bg-gradient-to-b from-white to-amber-50/40 shadow-warm-md' 
        : 'border-[#D2DFE2]/80 bg-white hover:border-amber-400 hover:shadow-warm-sm',
      bgIcon: stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-stone-100 text-stone-600 border border-stone-200',
      badge: stats.lowStockCount > 0 ? 'Needs Restock' : 'All Clear'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card) => {
        const isClickable = !card.noFilter;
        return (
          <div
            key={card.label}
            onClick={() => isClickable && onSelectFilter(card.id)}
            className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden ${card.borderClass} ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 group' : ''}`}
          >
            {/* Top Row: Label & Category Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {card.label}
              </span>
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${card.bgIcon}`}>
                {card.icon}
              </div>
            </div>

            {/* Middle: Big Stat Number */}
            <div className="space-y-1">
              <div className={`font-serif text-3xl sm:text-4xl font-bold tracking-tight ${card.colorClass}`}>
                {card.value}
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {card.subtext}
              </p>
            </div>

            {/* Bottom: Filter Pill CTA */}
            <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-stone-400">
                {card.badge}
              </span>
              {isClickable && (
                <span className="inline-flex items-center gap-1 text-[#1B8585] font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                  <span>{activeFilter === card.id ? 'Active Filter' : 'Filter View'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
