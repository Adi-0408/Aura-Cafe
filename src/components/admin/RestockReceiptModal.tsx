import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { useInventory, RestockSubmission } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Receipt, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Building2, 
  Image as ImageIcon,
  Boxes
} from 'lucide-react';

interface RestockReceiptModalProps {
  isOpen: boolean;
  targets: { item: InventoryItem; addQty: number }[];
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_RECEIPT_IMAGES = [
  'https://images.unsplash.com/photo-1554415707-9e4966a604f7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
];

export const RestockReceiptModal: React.FC<RestockReceiptModalProps> = ({
  isOpen,
  targets,
  onClose,
  onSuccess
}) => {
  const { restockWithReceipt } = useInventory();

  const [receiptNo, setReceiptNo] = useState(() => `REC-${Math.floor(10000 + Math.random() * 90000)}`);
  const [supplierName, setSupplierName] = useState(targets[0]?.item.supplier || 'Direct Origin Roasters');
  const [receiptImageUrl, setReceiptImageUrl] = useState(PRESET_RECEIPT_IMAGES[0]);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || targets.length === 0) return null;

  const totalRestockCost = targets.reduce((acc, t) => acc + (t.addQty * (t.item.unitCost || 0)), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate file upload with FileReader preview
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImageUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiptNo.trim()) {
      setError('Please provide a valid Receipt / Invoice number.');
      return;
    }

    if (!receiptImageUrl) {
      setError('Please upload or select a receipt invoice photo for verification.');
      return;
    }

    try {
      setIsSubmitting(true);
      const submission: RestockSubmission = {
        receiptNo: receiptNo.trim().toUpperCase(),
        receiptImageUrl,
        supplier: supplierName.trim() || 'Verified Supplier',
        items: targets.map(t => ({
          id: t.item.id,
          addQty: t.addQty
        })),
        notes: notes.trim()
      };

      await restockWithReceipt(submission);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit restock delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#F6F9FA] rounded-3xl max-w-xl w-full overflow-hidden shadow-warm-xl border border-[#D2DFE2] my-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#77C7C6]" />
            <div>
              <h3 className="font-serif text-lg font-bold">
                Restock Delivery & Receipt Verification
              </h3>
              <span className="text-[10px] text-stone-300">
                Invoice documentation required for audit and stock ledger
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items to be restocked summary */}
          <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase">
              <span className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#1B8585]" />
                Products Being Received ({targets.length})
              </span>
              <span>Total Cost: <strong className="text-[#10222B] font-mono">{formatCurrency(totalRestockCost)}</strong></span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {targets.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[#D2DFE2]/40 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-400 font-bold">{t.item.sku}</span>
                    <span className="font-serif font-bold text-[#10222B]">{t.item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#146868] bg-[#EBF7F7] px-2 py-0.5 rounded-md border border-[#A3DEDE] text-[11px]">
                      +{t.addQty} {t.item.unit}
                    </span>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {formatCurrency(t.addQty * t.item.unitCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt Number (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Receipt / Invoice Number *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="e.g. REC-89234"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#D2DFE2] text-xs font-mono font-bold text-[#10222B] uppercase focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Supplier / Vendor Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Andean Bean Co."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>
          </div>

          {/* Receipt Image Attachment (Required) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Receipt / Delivery Invoice Photo *
            </label>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#D2DFE2]">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-[#D2DFE2] shrink-0 shadow-xs">
                <img src={receiptImageUrl} alt="Receipt Preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] hover:bg-[#E5ECEE] cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-[#1B8585]" />
                  <span>{isUploading ? 'Uploading to Firebase...' : 'Upload Receipt Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-stone-400">
                  Select a photo from device or choose a verified template below:
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {PRESET_RECEIPT_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceiptImageUrl(img)}
                      className={`w-9 h-9 rounded-lg overflow-hidden border ${receiptImageUrl === img ? 'ring-2 ring-[#1B8585] border-transparent' : 'opacity-60 hover:opacity-100 border-stone-200'}`}
                    >
                      <img src={img} alt="Template" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Receiving Notes / Condition Check
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Seal intact, lot #489, stored in Dry Storage A1."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#D2DFE2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#77C7C6]" />
              <span>{isSubmitting ? 'Verifying...' : 'Confirm Delivery & Log Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
