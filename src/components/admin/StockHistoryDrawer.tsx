import React, { useState, useEffect } from 'react';
import { InventoryItem, StockLogEntry } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { 
  History, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  User, 
  FileText, 
  PackageCheck, 
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface StockHistoryDrawerProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockHistoryDrawer: React.FC<StockHistoryDrawerProps> = ({ item, isOpen, onClose }) => {
  const { getItemLogs, logStockAdjustment, updateStockQuantity } = useInventory();
  const [logs, setLogs] = useState<StockLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingAdjustment, setIsAddingAdjustment] = useState(false);
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState<StockLogEntry['reason']>('Waste / Spillage');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const loadLogs = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const history = await getItemLogs(item.id);
      setLogs(history);
    } catch (e) {
      console.warn('Error loading logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      loadLogs();
      setIsAddingAdjustment(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !adjustmentQty) return;
    const delta = parseFloat(adjustmentQty);
    if (isNaN(delta) || delta === 0) return;

    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    await updateStockQuantity(item.id, newQty, {
      previousQty: item.quantity,
      reason: adjustmentReason,
      notes: adjustmentNotes || `Manual adjustment: ${delta > 0 ? `+${delta}` : delta} ${item.unit}`
    });

    setAdjustmentQty('');
    setAdjustmentNotes('');
    setIsAddingAdjustment(false);
    await loadLogs();
  };

  const getReasonBadge = (reason: StockLogEntry['reason']) => {
    switch (reason) {
      case 'Received Shipment':
      case 'Restock Delivery':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Shipment Inbound
          </span>
        );
      case 'Waste / Spillage':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Waste / Spillage
          </span>
        );
      case 'Live Store Order':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5ECEE] text-[#1B8585] border border-[#D2DFE2]">
            Kitchen Depletion
          </span>
        );
      case 'Daily Audit':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Daily Floor Audit
          </span>
        );
      case 'Barcode Scan':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Scanner Action
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-300">
            {reason}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#F6F9FA] h-full shadow-2xl flex flex-col border-l border-[#D2DFE2] animate-slide-left">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#D2DFE2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#10222B]">
                  Stock Audit Trail
                </h3>
                <span className="font-mono text-[10px] bg-[#F2F6F7] text-stone-600 px-2 py-0.5 rounded-full border border-[#D2DFE2]">
                  SKU: {item.sku}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate max-w-[280px]">
                {item.name} ({item.quantity} {item.unit} in stock)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#F2F6F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="p-4 bg-white border-b border-[#D2DFE2] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Current Stock</span>
            <span className="font-bold text-[#10222B] text-base">{item.quantity} {item.unit}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Par Level</span>
            <span className="font-bold text-[#1B8585] text-base">{item.optimalParLevel || (item.minThreshold * 2.5)} {item.unit}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Min Alert</span>
            <span className="font-bold text-amber-700 text-base">{item.minThreshold} {item.unit}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-[#EEF4F6] border-b border-[#D2DFE2] flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-700">
            Chronological Stock Logs ({logs.length})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingAdjustment(!isAddingAdjustment)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#10222B] text-[#F2F6F7] text-xs font-semibold hover:bg-[#1E3A47] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#77C7C6]" />
              <span>Log Waste / Edit</span>
            </button>
            <button
              onClick={loadLogs}
              className="p-1.5 rounded-xl text-stone-500 hover:text-[#10222B] hover:bg-white border border-[#D2DFE2] transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Log Form */}
        {isAddingAdjustment && (
          <form onSubmit={handleCreateAdjustment} className="p-5 bg-white border-b border-[#D2DFE2] space-y-3 animate-slide-down">
            <h4 className="font-serif font-bold text-xs text-[#10222B] uppercase tracking-wider">
              Log Inventory Adjustment or Spillage
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Change Delta (+/- {item.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  placeholder="e.g. -2.5 or +5"
                  className="w-full px-3 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-mono font-bold text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Reason *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                >
                  <option value="Waste / Spillage">Waste / Spillage</option>
                  <option value="Received Shipment">Received Shipment</option>
                  <option value="Daily Audit">Daily Audit Correction</option>
                  <option value="Manual Edit">Manual Correction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Audit Notes / Incident Description
              </label>
              <input
                type="text"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="e.g. Dropped bag during morning rush or end of day count"
                className="w-full px-3 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingAdjustment(false)}
                className="px-3 py-1.5 rounded-xl text-stone-600 hover:bg-[#F2F6F7] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#1B8585] text-white text-xs font-semibold hover:bg-[#146868] shadow-xs"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        )}

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1B8585]" />
              <p className="text-xs">Loading stock history logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#D2DFE2] space-y-2 text-stone-400">
              <Clock className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs font-semibold text-stone-600">No stock change logs recorded yet.</p>
              <span className="text-[11px] block">Stock adjustments, restock receipts, and waste audits will automatically log here in real time.</span>
            </div>
          ) : (
            logs.map((log) => {
              const isPositive = log.changeDelta > 0;
              const isNegative = log.changeDelta < 0;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white border border-[#D2DFE2]/80 shadow-xs space-y-2 hover:border-[#1B8585]/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${
                        isPositive 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : isNegative 
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : '•'}
                      </div>
                      <span className="font-serif font-bold text-xs text-[#10222B]">
                        {isPositive ? `+${log.changeDelta}` : log.changeDelta} {item.unit}
                      </span>
                    </div>

                    {getReasonBadge(log.reason)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-600 bg-[#F2F6F7] px-3 py-1.5 rounded-xl font-mono text-[11px]">
                    <span>Before: <strong>{log.previousQty} {item.unit}</strong></span>
                    <span>→</span>
                    <span>After: <strong className="text-[#10222B]">{log.newQty} {item.unit}</strong></span>
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-stone-600 italic bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                      "{log.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatDate(log.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-stone-500">
                      <User className="w-3 h-3 text-[#1B8585]" />
                      {log.userDisplayName || 'Operations Team'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
