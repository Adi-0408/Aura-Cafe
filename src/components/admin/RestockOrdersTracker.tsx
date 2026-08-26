import React, { useState } from 'react';
import { RestockOrder } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { RestockOrderModal } from './RestockOrderModal';
import { 
  Truck, 
  PackageCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  ChevronRight, 
  Building2, 
  Receipt,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const RestockOrdersTracker: React.FC = () => {
  const { restockOrders, cancelRestockOrder, isSyncing } = useInventory();

  const [activeTab, setActiveTab] = useState<'active' | 'received' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [receivingOrder, setReceivingOrder] = useState<RestockOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activeOrders = restockOrders.filter(o => o.status === 'ordered' || o.status === 'in_transit');
  const receivedOrders = restockOrders.filter(o => o.status === 'received');

  const filteredOrders = restockOrders.filter(order => {
    if (activeTab === 'active' && !(order.status === 'ordered' || order.status === 'in_transit')) {
      return false;
    }
    if (activeTab === 'received' && order.status !== 'received') {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.supplierName.toLowerCase().includes(q) ||
      order.items.some(i => i.itemName.toLowerCase().includes(q))
    );
  });

  const handleCancel = async (orderId: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to cancel Restock Order #${orderNumber}?`)) {
      await cancelRestockOrder(orderId);
      setActionSuccess(`Restock Order #${orderNumber} was cancelled.`);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-sm overflow-hidden space-y-0">
      
      {/* Header & Actions */}
      <div className="p-5 sm:p-6 bg-[#F6F9FA] border-b border-[#D2DFE2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#10222B]">
                Restock Orders & Deliveries Pipeline
              </h3>
              {activeOrders.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                  {activeOrders.length} In Transit
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Track supplier purchase orders, schedule incoming shipments, and receive verified deliveries into stock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          {actionSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionSuccess}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Place Restock Order</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="px-6 py-4 bg-white border-b border-[#D2DFE2]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Pipeline Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white text-[#10222B] shadow-2xs'
                : 'text-stone-600 hover:text-[#10222B]'
            }`}
          >
            Ordered / In Transit ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'received'
                ? 'bg-white text-[#10222B] shadow-2xs'
                : 'text-stone-600 hover:text-[#10222B]'
            }`}
          >
            Delivered & Received ({receivedOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-[#10222B] shadow-2xs'
                : 'text-stone-600 hover:text-[#10222B]'
            }`}
          >
            All Orders ({restockOrders.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO #, supplier, items..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B8585]"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-stone-400 space-y-3">
          <Truck className="w-10 h-10 mx-auto text-stone-300" />
          <p className="text-sm font-medium text-stone-600">
            {activeTab === 'active' 
              ? 'No active restock orders currently in transit.' 
              : activeTab === 'received' 
              ? 'No received deliveries recorded yet.' 
              : 'No restock orders found.'}
          </p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Click "+ Place Restock Order" to create a purchase order with suppliers and replenish depleted stock.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#D2DFE2]/70">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isOrdered = order.status === 'ordered' || order.status === 'in_transit';
            const isReceived = order.status === 'received';
            const isCancelled = order.status === 'cancelled';
            const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantityOrdered, 0);

            return (
              <div 
                key={order.id} 
                className={`p-4 sm:p-5 hover:bg-[#F6F9FA] transition-colors ${
                  isExpanded ? 'bg-[#F2F6F7]/50' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: PO Number, Status, Supplier */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#10222B]">
                        #{order.orderNumber}
                      </span>

                      {/* Status Badge */}
                      {isOrdered && (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>Ordered / In Transit</span>
                        </span>
                      )}

                      {isReceived && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Delivered & Received</span>
                        </span>
                      )}

                      {isCancelled && (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          <span>Cancelled</span>
                        </span>
                      )}

                      <span className="text-stone-400 text-xs">•</span>
                      <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#1B8585]" />
                        {order.supplierName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>Ordered: <strong>{new Date(order.orderedAt).toLocaleDateString()}</strong> by {order.orderedBy}</span>
                      {order.expectedDeliveryDate && isOrdered && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-semibold">
                            Exp. Delivery: {order.expectedDeliveryDate}
                          </span>
                        </>
                      )}
                      {order.receivedAt && isReceived && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-800 font-semibold">
                            Received: {new Date(order.receivedAt).toLocaleDateString()} by {order.receivedBy}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Items Overview & Value */}
                  <div className="flex items-center gap-6">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-stone-400 block uppercase font-bold">Items Ordered</span>
                      <span className="text-xs font-semibold text-stone-800">
                        {order.items.length} SKUs ({totalItemsCount} units total)
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-stone-400 block uppercase font-bold">Order Value</span>
                      <span className="font-serif font-bold text-sm text-[#10222B]">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Action Controls */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    {isOrdered && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReceivingOrder(order)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          title="Verify delivery counts and credit stock"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Delivery</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={() => handleCancel(order.id, order.orderNumber)}
                          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel purchase order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-xl text-stone-500 hover:bg-[#E5ECEE] transition-colors"
                      title={isExpanded ? 'Collapse order details' : 'Expand order details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Itemized Line Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#D2DFE2] space-y-3 animate-fade-in text-xs">
                    <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#F2F6F7] border-b border-[#D2DFE2] grid grid-cols-12 font-bold text-stone-600 text-[11px]">
                        <span className="col-span-6">Item Description</span>
                        <span className="col-span-2 text-center">Ordered Qty</span>
                        <span className="col-span-2 text-center">Delivered Qty</span>
                        <span className="col-span-2 text-right">Line Total</span>
                      </div>
                      <div className="divide-y divide-[#D2DFE2]/60">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="px-4 py-2.5 grid grid-cols-12 items-center text-stone-800">
                            <span className="col-span-6 font-semibold">{item.itemName}</span>
                            <span className="col-span-2 text-center">{item.quantityOrdered} {item.unit}</span>
                            <span className="col-span-2 text-center">
                              {isReceived ? `${item.quantityReceived || item.quantityOrdered} ${item.unit}` : 'Pending'}
                            </span>
                            <span className="col-span-2 text-right font-mono font-bold text-[#10222B]">
                              {formatCurrency(item.totalCost)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.deliveryInvoiceNo && (
                      <div className="flex items-center gap-4 text-[11px] text-stone-600 px-1">
                        <span>Invoice No: <strong>{order.deliveryInvoiceNo}</strong></span>
                        {order.notes && <span>Notes: {order.notes}</span>}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Receive Delivery Modal */}
      <ReceiveDeliveryModal
        isOpen={!!receivingOrder}
        order={receivingOrder}
        onClose={() => setReceivingOrder(null)}
        onSuccess={() => {
          setActionSuccess(`Delivery received! Physical inventory stock was successfully credited.`);
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />

      {/* Create Restock Order Modal */}
      <RestockOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderNo) => {
          setActionSuccess(`Restock Order #${orderNo} created! Status: Ordered / In Transit.`);
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />

    </div>
  );
};
