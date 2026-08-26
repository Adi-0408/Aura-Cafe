import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { CustomSelect } from '../common/CustomSelect';
import { 
  Truck, 
  X, 
  Calendar, 
  Building2, 
  FileText, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';

interface RestockOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: { item: InventoryItem; suggestedQty?: number }[];
  onOrderCreated?: (orderNumber: string) => void;
}

export const RestockOrderModal: React.FC<RestockOrderModalProps> = ({
  isOpen,
  onClose,
  initialItems,
  onOrderCreated
}) => {
  const { inventory, createRestockOrder, isSyncing } = useInventory();

  const [selectedSupplier, setSelectedSupplier] = useState<string>('Specialty Origin Roasters & Farm Direct');
  const [supplierPhone, setSupplierPhone] = useState<string>('+91 98200 44321');
  const [supplierEmail, setSupplierEmail] = useState<string>('orders@specialtyorigin.com');
  const [expectedDate, setExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('Standard morning café replenishment delivery.');

  // Order items state: [{ itemId, quantityOrdered, unitCost }]
  const [orderItems, setOrderItems] = useState<{ itemId: string; quantityOrdered: number; unitCost: number }[]>([]);
  const [newItemId, setNewItemId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        const firstSupplier = initialItems[0].item.supplier || 'Specialty Origin Roasters & Farm Direct';
        setSelectedSupplier(firstSupplier);
        setSupplierPhone(initialItems[0].item.supplierPhone || '+91 98200 44321');
        setSupplierEmail(initialItems[0].item.supplierEmail || `orders@${firstSupplier.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);

        setOrderItems(
          initialItems.map(({ item, suggestedQty }) => {
            const par = item.optimalParLevel || Math.max(item.minThreshold * 2.5, item.minThreshold + 10);
            const qty = suggestedQty || Math.max(5, Math.ceil(par - item.quantity));
            return {
              itemId: item.id,
              quantityOrdered: qty,
              unitCost: item.unitCost
            };
          })
        );
      } else {
        // Default to first low stock items
        const lowStock = inventory.filter(i => !i.isArchived && i.quantity <= i.minThreshold);
        if (lowStock.length > 0) {
          const first = lowStock[0];
          setSelectedSupplier(first.supplier || 'Specialty Origin Roasters & Farm Direct');
          setOrderItems(
            lowStock.slice(0, 4).map(item => ({
              itemId: item.id,
              quantityOrdered: Math.max(5, Math.ceil((item.optimalParLevel || item.minThreshold * 2.5) - item.quantity)),
              unitCost: item.unitCost
            }))
          );
        } else if (inventory.length > 0) {
          setSelectedSupplier(inventory[0].supplier || 'Specialty Origin Roasters & Farm Direct');
          setOrderItems([{
            itemId: inventory[0].id,
            quantityOrdered: 10,
            unitCost: inventory[0].unitCost
          }]);
        }
      }
    }
  }, [isOpen, initialItems, inventory]);

  if (!isOpen) return null;

  const handleAddItem = (itemId: string) => {
    if (!itemId) return;
    if (orderItems.some(i => i.itemId === itemId)) return;
    const invItem = inventory.find(i => i.id === itemId);
    if (!invItem) return;

    setOrderItems(prev => [
      ...prev,
      {
        itemId: invItem.id,
        quantityOrdered: 10,
        unitCost: invItem.unitCost
      }
    ]);
    setNewItemId('');
  };

  const handleUpdateQty = (itemId: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setOrderItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantityOrdered: validQty } : i));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((acc, curr) => acc + (curr.quantityOrdered * curr.unitCost), 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (orderItems.length === 0) {
      setError('Please add at least one item to place a restock order.');
      return;
    }

    try {
      const newOrder = await createRestockOrder({
        supplierName: selectedSupplier,
        supplierPhone,
        supplierEmail,
        items: orderItems,
        expectedDeliveryDate: expectedDate,
        notes,
        orderedBy: 'Staff Operations'
      });

      if (onOrderCreated) {
        onOrderCreated(newOrder.orderNumber);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create restock purchase order.');
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
            <div className="w-10 h-10 rounded-xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center border border-[#1B8585]/40 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  Place Restock Order (Purchase Order)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Step 1: Ordered
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Place supplier order. Stock will remain unchanged until marked as Delivered & Received.
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
        <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier Info & Delivery Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1B8585]" />
                Supplier / Distributor Name
              </label>
              <input
                type="text"
                required
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] focus:ring-2 focus:ring-[#1B8585] focus:outline-none"
                placeholder="e.g. Specialty Origin Roasters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1B8585]" />
                Expected Delivery Date
              </label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] focus:ring-2 focus:ring-[#1B8585] focus:outline-none"
              />
            </div>
          </div>

          {/* Supplier Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Supplier Phone (Optional)
              </label>
              <input
                type="text"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D2DFE2] bg-white text-xs text-stone-800 focus:outline-none"
                placeholder="+91 98200 44321"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Supplier Email (Optional)
              </label>
              <input
                type="email"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D2DFE2] bg-white text-xs text-stone-800 focus:outline-none"
                placeholder="orders@supplier.com"
              />
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#1B8585]" />
                Items to Reorder ({orderItems.length})
              </label>
              <span className="text-[11px] text-stone-500">
                Adjust quantities required for replenishment
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden divide-y divide-[#D2DFE2]/60">
              {orderItems.map((entry) => {
                const item = inventory.find(i => i.id === entry.itemId);
                if (!item) return null;
                const lineTotal = entry.quantityOrdered * entry.unitCost;

                return (
                  <div key={entry.itemId} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-bold text-[#10222B] truncate">{item.name}</strong>
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-mono">
                          {item.sku}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Current On-Hand: <span className="font-semibold text-stone-700">{item.quantity} {item.unit}</span> | Unit Cost: {formatCurrency(entry.unitCost)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#D2DFE2] rounded-xl bg-stone-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(entry.itemId, entry.quantityOrdered - 1)}
                          className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={entry.quantityOrdered}
                          onChange={(e) => handleUpdateQty(entry.itemId, Number(e.target.value))}
                          className="w-14 text-center text-xs font-bold text-[#10222B] bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(entry.itemId, entry.quantityOrdered + 1)}
                          className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-bold text-[#10222B] w-20 text-right">
                        {formatCurrency(lineTotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(entry.itemId)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove item from order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add More Items Row */}
              <div className="p-3 bg-[#F2F6F7] flex items-center gap-2">
                <CustomSelect
                  value={newItemId}
                  onChange={(val) => {
                    if (val) {
                      handleAddItem(val);
                      setNewItemId('');
                    }
                  }}
                  options={[
                    { value: '', label: '+ Add another catalog item to this order...' },
                    ...inventory
                      .filter(i => !i.isArchived && !orderItems.some(o => o.itemId === i.id))
                      .map(item => ({
                        value: item.id,
                        label: `${item.name} (${item.sku})`,
                        sublabel: `Current Stock: ${item.quantity} ${item.unit} • Cost: ${formatCurrency(item.unitCost)}`
                      }))
                  ]}
                  placeholder="+ Add another catalog item to this order..."
                  className="flex-1"
                  buttonClassName="bg-white border-[#D2DFE2]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#1B8585]" />
              Order Instructions & Delivery Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2DFE2] bg-white text-xs text-[#10222B] focus:ring-2 focus:ring-[#1B8585] focus:outline-none"
              placeholder="e.g. Deliver before 10:00 AM via back kitchen alley"
            />
          </div>

          {/* Order Summary Total Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 block">
                Estimated Purchase Order Value
              </span>
              <span className="text-[11px] text-amber-700">
                Order status will set to <strong>"Ordered"</strong>. Physical stock will be credited upon delivery.
              </span>
            </div>
            <span className="font-serif font-bold text-xl text-[#10222B]">
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#D2DFE2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSyncing || orderItems.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Confirm & Place Order</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
