import React, { useState } from 'react';
import { LiveOrder } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatRelativeTime } from '../../utils/date';
import { exportDailyProfitToCSV } from '../../utils/exportCsv';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Coffee, 
  PieChart, 
  X, 
  Download, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Calendar,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface DailyProfitAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: LiveOrder[];
  collectedRevenue: number;
  completedItemsCount: number;
  onResetRegister: () => void;
}

export const DailyProfitAnalyticsModal: React.FC<DailyProfitAnalyticsModalProps> = ({
  isOpen,
  onClose,
  orders,
  collectedRevenue,
  completedItemsCount,
  onResetRegister,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const completedOrders = orders.filter(o => o.status === 'completed');

  // Compute Cost of Goods Sold (COGS) and Net Profit
  const totalCogs = completedOrders.reduce((acc, o) => {
    if (o.totalCostBasis) return acc + o.totalCostBasis;
    // Fallback if not stored: estimate ~28% cost of goods standard for artisan coffee & bakery
    return acc + (o.total * 0.28);
  }, 0);

  const netProfit = Math.max(0, collectedRevenue - totalCogs);
  const profitMarginPercent = collectedRevenue > 0 
    ? ((netProfit / collectedRevenue) * 100).toFixed(1) 
    : '0.0';

  const averageOrderValue = completedOrders.length > 0 
    ? collectedRevenue / completedOrders.length 
    : 0;

  const handleExportDailyReport = () => {
    exportDailyProfitToCSV({
      orders,
      collectedRevenue,
      completedItemsCount,
      totalCogs,
      netProfit,
      profitMarginPercent,
      averageOrderValue
    });

    setExportNotice('✓ Daily Profit Statement exported with executive summary and transaction ledger.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#F6F9FA] rounded-3xl max-w-4xl w-full overflow-hidden shadow-warm-2xl border border-[#D2DFE2] my-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center border border-[#1B8585]/40 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                Today's Revenue & Daily Profit Analytics
              </h3>
              <p className="text-xs text-stone-300">
                Real-time financial breakdown based on ingredient cost basis & completed orders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">

          {exportNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}
          
          {/* Executive KPI Summary 4-Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Gross Revenue */}
            <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Gross Revenue</span>
              <div className="font-serif text-2xl font-bold text-emerald-800">
                {formatCurrency(collectedRevenue)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">Collected from paid orders</span>
            </div>

            {/* Estimated COGS */}
            <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Ingredient Costs (COGS)</span>
              <div className="font-serif text-2xl font-bold text-stone-700">
                {formatCurrency(totalCogs)}
              </div>
              <span className="text-[10px] text-stone-500 block">Beans, dairy, & packaging</span>
            </div>

            {/* Net Profit */}
            <div className="p-4 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#146868] uppercase">Today's Net Profit</span>
              <div className="font-serif text-2xl font-bold text-[#10222B]">
                {formatCurrency(netProfit)}
              </div>
              <span className="text-[10px] text-[#1B8585] font-semibold block">Margin: {profitMarginPercent}%</span>
            </div>

            {/* Total Orders / AOV */}
            <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Completed Tickets</span>
              <div className="font-serif text-2xl font-bold text-[#10222B]">
                {completedOrders.length} <span className="text-sm font-normal text-stone-500">({completedItemsCount} items)</span>
              </div>
              <span className="text-[10px] text-stone-500 block">Avg Ticket: {formatCurrency(averageOrderValue)}</span>
            </div>

          </div>

          {/* Completed Orders Detailed Ledger */}
          <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#D2DFE2] flex items-center justify-between bg-[#F2F6F7] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#1B8585]" />
                <h4 className="font-serif font-bold text-sm text-[#10222B]">
                  Today's Completed Orders Ledger ({completedOrders.length})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDailyReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#E5ECEE] text-[#10222B] text-xs font-bold border border-[#D2DFE2] transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  title="Export complete daily profit statement as formatted Excel CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B8585]" />
                  <span>Download Excel Statement</span>
                </button>
              </div>
            </div>

            {completedOrders.length === 0 ? (
              <div className="p-8 text-center text-stone-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-medium">
                  No orders have been marked as completed/paid in this register session yet.
                </p>
                <p className="text-[11px] text-stone-400">
                  You can still download the Excel Statement above to obtain the current daily executive summary sheet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#D2DFE2]/60">
                {completedOrders.map((order) => {
                  const orderCogs = order.totalCostBasis || (order.total * 0.28);
                  const orderProfit = Math.max(0, order.total - orderCogs);
                  const orderMargin = order.total > 0 ? ((orderProfit / order.total) * 100).toFixed(0) : '0';
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div 
                      key={order.id} 
                      className={`p-4 hover:bg-[#F2F6F7] transition-colors cursor-pointer text-xs ${isSelected ? 'bg-[#EBF7F7]/60' : ''}`}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <strong className="font-bold text-[#10222B]">Order #{order.orderNumber}</strong>
                            <span className="text-stone-400">•</span>
                            <span className="text-stone-700 font-medium">{order.customerName}</span>
                            <span className="text-stone-400">•</span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              {order.completedAt ? formatRelativeTime(order.completedAt) : 'Today'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-stone-500 truncate max-w-lg">
                            {order.items.map(i => `${i.quantity}x ${i.name}${i.customization ? ` (${i.customization})` : ''}`).join(', ')}
                          </div>
                        </div>

                        {/* Financial Metrics Strip */}
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase font-bold">Revenue</span>
                            <span className="font-mono font-bold text-[#10222B] text-sm">{formatCurrency(order.total)}</span>
                          </div>

                          <div className="hidden sm:block">
                            <span className="text-[10px] text-stone-400 block uppercase font-bold">COGS</span>
                            <span className="font-mono text-stone-500">{formatCurrency(orderCogs)}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-emerald-800 block uppercase font-bold">Net Profit</span>
                            <span className="font-mono font-bold text-emerald-700">+{formatCurrency(orderProfit)}</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                            Number(orderMargin) >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {orderMargin}%
                          </span>
                        </div>
                      </div>

                      {/* Expandable Recipe / Inventory Deductions Breakdown */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-[#D2DFE2] space-y-1.5 text-[11px] bg-white p-3 rounded-xl border">
                          <strong className="text-stone-700 block font-semibold">Ingredient Cost Basis Breakdown:</strong>
                          {order.depletedIngredients && order.depletedIngredients.length > 0 ? (
                            <ul className="space-y-0.5 text-stone-600">
                              {order.depletedIngredients.map((d, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>• {d.itemName} ({d.amountDeducted} {d.unit})</span>
                                  <span className="font-mono text-stone-500">
                                    {d.unitCost ? formatCurrency(d.amountDeducted * d.unitCost) : '₹0.00'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-stone-500">Standard 28% raw materials cost basis applied.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-[#F2F6F7] border-t border-[#D2DFE2] flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={onResetRegister}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Register to ₹0.00</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDailyReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D2DFE2] text-[#10222B] text-xs font-bold hover:bg-[#E5ECEE] transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-semibold hover:bg-[#1E3A47] transition-colors cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
