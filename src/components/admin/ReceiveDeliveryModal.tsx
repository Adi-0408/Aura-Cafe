import React, { useState, useRef } from 'react';
import { RestockOrder } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { 
  PackageCheck, 
  X, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Building2, 
  Calendar,
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  XCircle
} from 'lucide-react';

interface ReceiveDeliveryModalProps {
  isOpen: boolean;
  order: RestockOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReceiveDeliveryModal: React.FC<ReceiveDeliveryModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess
}) => {
  const { receiveRestockDelivery, cancelRestockOrder, isSyncing } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [invoiceNo, setInvoiceNo] = useState<string>(() => `INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [receivedBy, setReceivedBy] = useState<string>('Staff Barista & Shift Lead');
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
  const [livePhotoUrl, setLivePhotoUrl] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Items inspected and verified in good condition.');
  const [error, setError] = useState<string | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // Initialize actual quantities from ordered quantities
  React.useEffect(() => {
    if (order) {
      const initialMap: Record<string, number> = {};
      order.items.forEach(i => {
        initialMap[i.itemId] = i.quantityOrdered;
      });
      setActualQuantities(initialMap);
      setInvoiceNo(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
      setLivePhotoUrl(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleCancelPurchaseOrder = async () => {
    if (!order) return;
    try {
      await cancelRestockOrder(order.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel purchase order.');
    }
  };

  const handleQtyChange = (itemId: string, qty: number) => {
    setActualQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, qty)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLivePhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalReceivedCost = () => {
    return order.items.reduce((sum, item) => {
      const qty = actualQuantities[item.itemId] !== undefined ? actualQuantities[item.itemId] : item.quantityOrdered;
      return sum + (qty * item.unitCost);
    }, 0);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await receiveRestockDelivery(order.id, {
        deliveryInvoiceNo: invoiceNo,
        receivedBy,
        actualQuantities,
        deliveryReceiptImageUrl: livePhotoUrl || undefined,
        notes: deliveryNotes
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm delivery and receive stock.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#F6F9FA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-warm-2xl border border-[#D2DFE2] my-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center border border-emerald-500/40 shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  Receive Delivery for {order.orderNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Step 2: Delivery & Receipt
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Verify delivered counts and capture live goods photo. Physical on-hand stock will be credited.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleConfirmReceive} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier & Order Info Strip */}
          <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1B8585]" />
              <span className="font-semibold text-stone-700">Supplier:</span>
              <strong className="text-[#10222B]">{order.supplierName}</strong>
            </div>

            <div className="flex items-center gap-2 text-stone-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ordered: {new Date(order.orderedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Invoice & Receiver Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#1B8585]" />
                Delivery Challan / Invoice No.
              </label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. INV-88421"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Received By (Staff Name)
              </label>
              <input
                type="text"
                required
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="Staff Member"
              />
            </div>
          </div>

          {/* Item Verification Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                Delivered Items & Quantity Verification
              </label>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Adjust if delivered amount differs from PO
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden divide-y divide-[#D2DFE2]/60">
              {order.items.map((item) => {
                const currentQty = actualQuantities[item.itemId] !== undefined ? actualQuantities[item.itemId] : item.quantityOrdered;
                const isMatching = currentQty === item.quantityOrdered;

                return (
                  <div key={item.itemId} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <strong className="font-bold text-[#10222B] block">{item.itemName}</strong>
                      <span className="text-[11px] text-stone-500">
                        PO Ordered: <strong className="text-stone-700">{item.quantityOrdered} {item.unit}</strong> @ {formatCurrency(item.unitCost)}/{item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <label className="text-[10px] text-stone-500 font-semibold block uppercase">
                          Delivered Qty
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentQty}
                            onChange={(e) => handleQtyChange(item.itemId, Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-[#D2DFE2] bg-stone-50 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                          />
                          <span className="text-xs font-medium text-stone-600">{item.unit}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        isMatching ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isMatching ? '✓ Matches PO' : 'Adjusted'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Live Photo Upload of Delivered Goods */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#1B8585]" />
              Live Photo of Goods / Delivery Bill Proof
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {livePhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-black/5 aspect-video sm:aspect-21/9 max-h-56 flex items-center justify-center group">
                <img 
                  src={livePhotoUrl} 
                  alt="Delivered Goods Live Proof" 
                  className="w-full h-full object-contain bg-stone-900" 
                />
                
                {/* Photo Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-[#10222B] text-xs font-bold shadow-md hover:bg-[#F2F6F7] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#1B8585]" />
                    <span>Retake / Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLivePhotoUrl(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Live Photo Attached</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D2DFE2] hover:border-emerald-600 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white hover:bg-emerald-50/20 group space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EBF7F7] text-[#1B8585] group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center mx-auto transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#10222B] block">
                    Take Live Photo of Goods or Click to Upload
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Capture delivery condition, package box, or physical invoice via camera/file
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Inspection Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#1B8585]" />
              Receiving Inspection Notes
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              placeholder="e.g. All seal packaging intact and expiration dates verified."
            />
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-900 block">
                Total Verified Goods Received
              </span>
              <span className="text-[11px] text-emerald-700">
                On-hand inventory counts will be automatically credited with these quantities.
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-emerald-900">
              {formatCurrency(calculateTotalReceivedCost())}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#D2DFE2] flex flex-col sm:flex-row items-center justify-between gap-3">
            {showCancelPrompt ? (
              <div className="flex items-center gap-2 bg-rose-50 p-1.5 px-3 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-900 font-bold">Cancel this PO entirely?</span>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleCancelPurchaseOrder}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Yes, Cancel PO
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-2 py-1 rounded-lg text-stone-500 hover:bg-white text-xs font-semibold cursor-pointer"
                >
                  Keep PO
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer py-1 self-start sm:self-auto"
                title="Cancel and void this purchase order"
              >
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Cancel this Order instead</span>
              </button>
            )}

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSyncing}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery & Credit Stock</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
