import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryCategory, InventoryUnit } from '../../types';
import { uploadProductImage } from '../../services/firebaseService';
import { formatCurrency, calculateGrossMargin } from '../../utils/currency';
import { CustomSelect } from '../common/CustomSelect';
import { X, Upload, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: InventoryItem) => Promise<void>;
}

const CATEGORIES: InventoryCategory[] = [
  'Raw Ingredients',
  'Retail Coffee Beans',
  'Dairy & Alt',
  'Packaging',
  'Bakery & Pantry'
];

const UNITS: InventoryUnit[] = ['kg', 'g', 'L', 'ml', 'packs', 'units', 'boxes', 'bags'];

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
];

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, item, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Raw Ingredients');
  const [unit, setUnit] = useState<InventoryUnit>('kg');
  const [quantity, setQuantity] = useState<number>(10);
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number>(750.00);
  const [price, setPrice] = useState<number>(1400.00);
  const [supplier, setSupplier] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [location, setLocation] = useState('Roastery Green Silo #1');
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGES[0]);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku);
      setCategory(item.category);
      setUnit(item.unit);
      setQuantity(item.quantity);
      setMinThreshold(item.minThreshold);
      setUnitCost(item.unitCost);
      setPrice(item.price);
      setSupplier(item.supplier);
      setSupplierPhone(item.supplierPhone || '');
      setSupplierEmail(item.supplierEmail || '');
      setLocation(item.location);
      setImageUrl(item.imageUrl);
      setNotes(item.notes || '');
    } else {
      setName('');
      setSku(`ITEM-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Raw Ingredients');
      setUnit('kg');
      setQuantity(10);
      setMinThreshold(5);
      setUnitCost(750.00);
      setPrice(1400.00);
      setSupplier('Artisan Direct Supply');
      setSupplierPhone('+91 98200 11223');
      setSupplierEmail('orders@artisansupply.com');
      setLocation('Roastery Dry Storage A1');
      setImageUrl(DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)]);
      setNotes('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadProductImage(file, 'inventory');
      setImageUrl(url);
    } catch (err: any) {
      setError('Image upload failed, please select one of the presets or retry.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim()) {
      setError('Please provide both product name and item code.');
      return;
    }

    try {
      setIsSaving(true);
      const updatedItem: InventoryItem = {
        id: item ? item.id : `inv-${Date.now().toString(36)}`,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category,
        unit,
        quantity: Number(quantity),
        minThreshold: Number(minThreshold),
        unitCost: Number(unitCost),
        price: Number(price),
        supplier: supplier.trim() || 'Verified Roastery Supplier',
        supplierPhone: supplierPhone.trim() || undefined,
        supplierEmail: supplierEmail.trim() || undefined,
        location: location.trim() || 'General Roastery Storage',
        imageUrl: imageUrl.trim() || DEFAULT_IMAGES[0],
        isArchived: item ? item.isArchived : false,
        updatedAt: Date.now(),
        notes: notes.trim() || undefined
      };

      await onSave(updatedItem);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const margin = calculateGrossMargin(unitCost, price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-[#F6F9FA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-warm-xl border border-[#D2DFE2] my-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold">
              {item ? `Edit Product: ${item.name}` : 'Provision New Inventory Product'}
            </h3>
            <span className="text-xs text-stone-300">
              Real-time Firestore catalog integration & automated stock ledger
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#1B8585] uppercase tracking-wider">
              1. Product Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product / Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ethiopia Yirgacheffe Natural"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-medium text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product / Item Code *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. RAW-ETH-001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-mono font-bold text-[#10222B] uppercase focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category *
                </label>
                <CustomSelect
                  value={category}
                  onChange={(val) => setCategory(val as InventoryCategory)}
                  options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unit of Measurement *
                </label>
                <CustomSelect
                  value={unit}
                  onChange={(val) => setUnit(val as InventoryUnit)}
                  options={UNITS.map(u => ({ value: u, label: u }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Stock Levels & Financials */}
          <div className="space-y-4 pt-2 border-t border-[#D2DFE2]/60">
            <h4 className="text-xs font-bold text-[#1B8585] uppercase tracking-wider">
              2. Stock Counts & Financial Economics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Current Stock Qty
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Min Threshold
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Retail Price (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>

            {/* Live Margin Calculation Tag */}
            <div className="p-3.5 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] flex items-center justify-between text-xs">
              <span className="text-stone-600">
                Gross Margin on Retail: <strong className={`font-mono font-bold ${margin >= 40 ? 'text-emerald-700' : 'text-amber-700'}`}>{margin}%</strong>
              </span>
              <span className="text-stone-600">
                Total Valuation on Hand: <strong className="font-mono text-[#10222B]">{formatCurrency(quantity * unitCost)}</strong>
              </span>
            </div>
          </div>

          {/* Section 3: Supply Chain & Storage */}
          <div className="space-y-4 pt-2 border-t border-[#D2DFE2]/60">
            <h4 className="text-xs font-bold text-[#1B8585] uppercase tracking-wider">
              3. Supplier & Storage Location
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Direct Origin Imports"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Physical Storage Bay / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Roastery Green Silo #2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supplier Phone
                </label>
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supplier Email
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="orders@directorigins.coffee"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Imagery & Notes */}
          <div className="space-y-4 pt-2 border-t border-[#D2DFE2]/60">
            <h4 className="text-xs font-bold text-[#1B8585] uppercase tracking-wider">
              4. Product Photo & Notes
            </h4>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-[#D2DFE2] shrink-0">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D2DFE2] text-xs font-semibold text-[#10222B] hover:bg-[#F2F6F7] cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-[#1B8585]" />
                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2 pt-1">
                  {DEFAULT_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(img)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border ${imageUrl === img ? 'ring-2 ring-[#1B8585] border-transparent' : 'opacity-60 hover:opacity-100 border-stone-200'}`}
                    >
                      <img src={img} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Internal Inventory Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Harvest batch lot #249, storage climate alerts, blend recipes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D2DFE2] text-xs text-[#10222B] focus:outline-none focus:border-[#1B8585]"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-[#D2DFE2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-warm-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#77C7C6]" />
              <span>{isSaving ? 'Syncing...' : item ? 'Save Product Changes' : 'Create Product'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
