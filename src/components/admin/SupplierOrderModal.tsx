import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { SupplierOrderSheet } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { 
  FileText, 
  X, 
  Download, 
  Printer, 
  Building2, 
  Phone, 
  Mail, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Send,
  Calculator
} from 'lucide-react';

interface SupplierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierOrderModal: React.FC<SupplierOrderModalProps> = ({ isOpen, onClose }) => {
  const { getSupplierOrderSheets, restockWithReceipt } = useInventory();
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sheets = getSupplierOrderSheets();

  if (!isOpen) return null;

  const currentSheet: SupplierOrderSheet | undefined = sheets[selectedSupplierIndex] || sheets[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!currentSheet) return;
    const headers = ['SKU', 'Item Name', 'Category', 'Current Stock', 'Par Level', 'Suggested Reorder Qty', 'Unit Cost (INR)', 'Estimated Cost (INR)', 'Unit'];
    const rows = currentSheet.items.map(i => [
      `"${i.item.sku}"`,
      `"${i.item.name}"`,
      `"${i.item.category}"`,
      i.currentStock,
      i.optimalParLevel,
      i.suggestedReorderQty,
      i.unitCost,
      i.estimatedCost,
      `"${i.item.unit}"`
    ]);

    const csvContent = [
      `Supplier Purchase Order Sheet: ${currentSheet.supplierName}`,
      `Generated Date: ${new Date().toLocaleString('en-IN')}`,
      `Supplier Contact: ${currentSheet.supplierPhone} | ${currentSheet.supplierEmail}`,
      `Total Estimated Cost: ₹${currentSheet.totalCost.toFixed(2)}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Order_${currentSheet.supplierName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#D2DFE2] shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-full print:rounded-none">
        
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-[#10222B] text-white flex items-center justify-between print:bg-white print:text-black print:p-4 print:border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center print:hidden">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-white print:text-black">
                  Supplier Purchase Order Sheet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1B8585] text-white text-[10px] font-bold uppercase tracking-wider print:hidden">
                  Par-Level Calculated
                </span>
              </div>
              <p className="text-xs text-stone-300 print:text-stone-600 mt-0.5">
                Dynamic replenishment calculations based on safety par levels: <code className="font-mono text-[#77C7C6] print:text-black">Order = Math.max(0, Par - Stock)</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors print:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Supplier Selector Tabs (if multiple suppliers) */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-2 px-6 pt-4 bg-[#F6F9FA] border-b border-[#D2DFE2] overflow-x-auto print:hidden">
            {sheets.map((sheet, idx) => (
              <button
                key={sheet.supplierName}
                onClick={() => setSelectedSupplierIndex(idx)}
                className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                  selectedSupplierIndex === idx
                    ? 'border-[#1B8585] text-[#10222B] bg-white shadow-xs'
                    : 'border-transparent text-stone-500 hover:text-[#10222B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#1B8585]" />
                <span>{sheet.supplierName} ({sheet.items.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          
          {sheets.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-serif font-bold text-lg text-[#10222B]">All Inventory Within Par Levels!</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No items are currently below minimum thresholds. All supply chain buffers are healthy and fully replenished.
              </p>
            </div>
          ) : currentSheet ? (
            <>
              {/* Supplier Info & Purchase Meta Card */}
              <div className="p-6 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 uppercase font-bold text-[10px] block">Supplier Company</span>
                  <strong className="text-sm text-[#10222B] font-serif block mt-0.5">{currentSheet.supplierName}</strong>
                  <span className="text-stone-500 block mt-1">{currentSheet.items.length} replenishments queued</span>
                </div>

                <div>
                  <span className="text-stone-400 uppercase font-bold text-[10px] block">Supplier Contact</span>
                  <div className="space-y-0.5 mt-0.5 text-stone-700">
                    <span className="flex items-center gap-1.5 font-semibold"><Phone className="w-3.5 h-3.5 text-[#1B8585]" /> {currentSheet.supplierPhone}</span>
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#1B8585]" /> {currentSheet.supplierEmail}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-stone-400 uppercase font-bold text-[10px] block">Total Purchase Cost</span>
                  <strong className="font-serif font-bold text-xl text-[#1B8585] block mt-0.5">
                    {formatCurrency(currentSheet.totalCost)}
                  </strong>
                  <span className="text-stone-400 text-[11px] block">Generated {formatDate(currentSheet.generatedAt)}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-2xl border border-[#D2DFE2] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#EEF4F6] text-stone-700 font-bold border-b border-[#D2DFE2]">
                    <tr>
                      <th className="p-3.5">SKU & Item Name</th>
                      <th className="p-3.5 text-center">Current Stock</th>
                      <th className="p-3.5 text-center">Par Level</th>
                      <th className="p-3.5 text-center bg-[#E5ECEE] text-[#1B8585]">Suggested Order</th>
                      <th className="p-3.5 text-right">Unit Cost</th>
                      <th className="p-3.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2DFE2]/60 font-sans">
                    {currentSheet.items.map((orderItem) => (
                      <tr key={orderItem.item.id} className="hover:bg-[#F2F6F7]/50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-serif font-bold text-[#10222B] block">{orderItem.item.name}</span>
                          <span className="font-mono text-[11px] text-stone-400">SKU: {orderItem.item.sku} • {orderItem.item.category}</span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-stone-700">
                          <span className={orderItem.currentStock === 0 ? 'text-rose-600' : 'text-amber-700'}>
                            {orderItem.currentStock} {orderItem.item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-stone-600 font-semibold">
                          {orderItem.optimalParLevel} {orderItem.item.unit}
                        </td>
                        <td className="p-3.5 text-center font-bold text-[#1B8585] bg-[#F2F6F7] font-mono text-sm">
                          +{orderItem.suggestedReorderQty} {orderItem.item.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono text-stone-600">
                          {formatCurrency(orderItem.unitCost)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#10222B] font-mono">
                          {formatCurrency(orderItem.estimatedCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F6F9FA] border-t border-[#D2DFE2] font-bold">
                    <tr>
                      <td colSpan={5} className="p-3.5 text-right text-stone-600 uppercase text-[11px] tracking-wider">
                        Total Order Estimated Investment:
                      </td>
                      <td className="p-3.5 text-right font-serif text-base text-[#1B8585]">
                        {formatCurrency(currentSheet.totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 print:hidden">
                <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Receiving Verification Notice:</strong>
                  <span>When this shipment arrives at the roastery dock, use the "Restock with Receipt" tool to record invoice receipt numbers and upload proof of delivery.</span>
                </div>
              </div>
            </>
          ) : null}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-[#F6F9FA] border-t border-[#D2DFE2] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <span className="text-xs text-stone-500">
            Aura Kitchen & Roastery Supply-Chain Operations Suite
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              disabled={sheets.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#EEF4F6] text-[#10222B] text-xs font-semibold border border-[#D2DFE2] transition-colors shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-[#1B8585]" />
              <span>Print Clipboard Sheet</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={sheets.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-warm-sm active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#77C7C6]" />
              <span>Export Purchase Order CSV</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
