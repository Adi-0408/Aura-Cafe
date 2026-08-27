import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem, RestockOrder } from '../../types';
import { StockStatusBadge } from '../common/Badge';
import { RestockOrderModal } from './RestockOrderModal';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { formatCurrency } from '../../utils/currency';
import { 
  AlertTriangle, 
  AlertOctagon,
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  PackageCheck, 
  CheckCircle2, 
  Clock,
  Plus
} from 'lucide-react';

export const RestockAlertPanel: React.FC = () => {
  const { 
    criticalRestockItems, 
    getIncomingQtyForItem, 
    getActiveRestockOrderForItem, 
    isSyncing,
    stats
  } = useInventory();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalItems, setOrderModalItems] = useState<{ item: InventoryItem; suggestedQty?: number }[]>([]);
  const [receivingOrder, setReceivingOrder] = useState<RestockOrder | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const openOrderModalForSingle = (item: InventoryItem, qty?: number) => {
    setOrderModalItems([{ item, suggestedQty: qty }]);
    setIsOrderModalOpen(true);
  };

  const openOrderModalForAll = () => {
    const allTargets = criticalRestockItems.map(item => ({
      item,
      suggestedQty: Math.max(10, Math.ceil((item.optimalParLevel || item.minThreshold * 2.5) - item.quantity))
    }));
    setOrderModalItems(allTargets);
    setIsOrderModalOpen(true);
  };

  if (criticalRestockItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-warm-sm overflow-hidden transition-all">
        
        {/* Alert Header Bar */}
        <div 
          className="p-5 bg-amber-50/70 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 cursor-pointer flex-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-[#10222B]">
                  Critical Stock Depletion Requisition ({criticalRestockItems.length} Items Below Threshold)
                </h3>
                {stats.outOfStockCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertOctagon className="w-3 h-3 text-rose-600" />
                    {stats.outOfStockCount} Out of Stock
                  </span>
                )}
                {stats.lowStockCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {stats.lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Place supplier restock orders. When delivery arrives, verify counts to receive into on-hand stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {successNotice && (
              <span className="text-xs text-emerald-700 font-semibold px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200 animate-fade-in flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {successNotice}
              </span>
            )}

            <button
              type="button"
              disabled={isSyncing}
              onClick={openOrderModalForAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Create supplier purchase order for all depleted items"
            >
              <Truck className="w-3.5 h-3.5 text-[#77C7C6]" />
              <span>+ Place Restock Order (All)</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-stone-500 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Grid of Restock Cards */}
        {isExpanded && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {criticalRestockItems.map((item) => {
              const isCriticalZero = item.quantity <= 0;
              const deficit = Math.max(0, item.minThreshold - item.quantity);
              const incomingQty = getIncomingQtyForItem(item.id);
              const activeOrder = getActiveRestockOrderForItem(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border bg-white shadow-xs space-y-4 flex flex-col justify-between ${
                    isCriticalZero ? 'border-rose-200 bg-rose-50/10' : 'border-[#D2DFE2]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-[#D2DFE2] shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase text-stone-400 block">
                          {item.sku}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-[#10222B] line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          📍 {item.location}
                        </span>
                      </div>
                    </div>

                    <StockStatusBadge quantity={item.quantity} minThreshold={item.minThreshold} />
                  </div>

                  {/* Incoming Order Notice (If order already placed) */}
                  {incomingQty > 0 && activeOrder ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>PO #{activeOrder.orderNumber}: <strong>+{incomingQty} {item.unit}</strong> ordered</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceivingOrder(activeOrder)}
                        className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PackageCheck className="w-3 h-3" />
                        <span>Receive</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Level Progress */}
                  <div className="space-y-2 bg-[#F2F6F7] p-3 rounded-xl border border-[#D2DFE2]/60 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-stone-500">Stock vs Target:</span>
                      <span className="font-bold text-[#10222B]">
                        {item.quantity} / {item.minThreshold} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCriticalZero ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (item.quantity / (item.minThreshold || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 pt-0.5">
                      <span>Deficit: <strong className="text-rose-700">+{deficit.toFixed(1)} {item.unit}</strong></span>
                      <span>Cost: <strong>{formatCurrency(deficit * item.unitCost)}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D2DFE2]/50">
                    <div className="flex items-center gap-1.5">
                      {item.supplierPhone && (
                        <a
                          href={`tel:${item.supplierPhone}`}
                          className="p-2 rounded-lg bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] transition-colors"
                          title={`Call ${item.supplier}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#1B8585]" />
                        </a>
                      )}
                      {item.supplierEmail && (
                        <a
                          href={`mailto:${item.supplierEmail}?subject=Restock PO: ${item.name} (${item.sku})`}
                          className="p-2 rounded-lg bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] transition-colors"
                          title={`Email ${item.supplier}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-[#1B8585]" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => openOrderModalForSingle(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Order Restock</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Create Restock Order Modal */}
      <RestockOrderModal
        isOpen={isOrderModalOpen}
        initialItems={orderModalItems}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderNo) => {
          setSuccessNotice(`Order #${orderNo} placed! Status set to "Ordered / In Transit".`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />

      {/* Receive Delivery Modal */}
      <ReceiveDeliveryModal
        isOpen={!!receivingOrder}
        order={receivingOrder}
        onClose={() => setReceivingOrder(null)}
        onSuccess={() => {
          setSuccessNotice(`Shipment received! Physical inventory stock successfully credited.`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />
    </>
  );
};
