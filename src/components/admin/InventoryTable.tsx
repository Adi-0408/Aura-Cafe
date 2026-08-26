import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem, InventoryCategory, StockFilter, RestockOrder } from '../../types';
import { StockStatusBadge } from '../common/Badge';
import { InlineStockEditor } from './InlineStockEditor';
import { RestockOrderModal } from './RestockOrderModal';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { StockHistoryDrawer } from './StockHistoryDrawer';
import { SupplierOrderModal } from './SupplierOrderModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { formatCurrency } from '../../utils/currency';
import { CustomSelect } from '../common/CustomSelect';
import { 
  Search, 
  Edit3, 
  Archive, 
  Trash2, 
  Plus, 
  RotateCcw, 
  X,
  ArrowUpDown,
  Zap,
  History,
  ScanLine,
  FileText,
  Barcode,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  MapPin,
  Truck,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Minus,
  Sparkles,
  Clock
} from 'lucide-react';

interface InventoryTableProps {
  onEditItem: (item: InventoryItem) => void;
  onAddNewItem: () => void;
  initialFilter?: StockFilter;
}

const CATEGORIES: (InventoryCategory | 'All')[] = [
  'All',
  'Raw Ingredients',
  'Retail Coffee Beans',
  'Dairy & Alt',
  'Packaging',
  'Bakery & Pantry'
];

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  onEditItem, 
  onAddNewItem,
  initialFilter = 'all'
}) => {
  const { 
    inventory, 
    updateStockQuantity, 
    updatePrice, 
    toggleArchive, 
    deleteItem,
    getIncomingQtyForItem,
    getActiveRestockOrderForItem,
    isSyncing
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<StockFilter>(initialFilter);
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Modals & Drawers state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalTargets, setOrderModalTargets] = useState<{ item: InventoryItem; suggestedQty?: number }[]>([]);
  const [receivingOrder, setReceivingOrder] = useState<RestockOrder | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [historyTargetItem, setHistoryTargetItem] = useState<InventoryItem | null>(null);
  const [tableNotice, setTableNotice] = useState<string | null>(null);

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: inventory.filter(i => !i.isArchived).length };
    CATEGORIES.forEach(c => {
      if (c !== 'All') {
        counts[c] = inventory.filter(i => !i.isArchived && i.category === c).length;
      }
    });
    return counts;
  }, [inventory]);

  // Status counts
  const statusCounts = useMemo(() => {
    const active = inventory.filter(i => !i.isArchived);
    return {
      all: active.length,
      in_stock: active.filter(i => i.quantity > i.minThreshold).length,
      low_stock: active.filter(i => i.quantity > 0 && i.quantity <= i.minThreshold).length,
      out_of_stock: active.filter(i => i.quantity <= 0).length,
      archived: inventory.filter(i => i.isArchived).length
    };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      // Archive filter check
      if (statusFilter === 'archived') {
        if (!item.isArchived) return false;
      } else {
        if (item.isArchived) return false;
        
        if (statusFilter === 'in_stock' && (item.quantity <= item.minThreshold)) return false;
        if (statusFilter === 'low_stock' && (item.quantity <= 0 || item.quantity > item.minThreshold)) return false;
        if (statusFilter === 'out_of_stock' && item.quantity > 0) return false;
      }

      // Category check
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchesSupplier = item.supplier.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesSupplier && !matchesLocation) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortAsc 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortAsc 
        ? (Number(aVal) - Number(bVal))
        : (Number(bVal) - Number(aVal));
    });
  }, [inventory, statusFilter, selectedCategory, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    await updateStockQuantity(item.id, newQty);
  };

  const handleDeletePrompt = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to permanently purge "${item.name}" (${item.sku})? For standard removals, we recommend archiving instead.`)) {
      await deleteItem(item.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card: Controls, View Switcher & Action Suite */}
      <div className="bg-white rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm p-6 sm:p-8 space-y-6">
        
        {/* Row 1: Status Tabs, View Switcher, and Main Action CTAs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Products', count: statusCounts.all },
              { id: 'in_stock', label: 'In Stock', count: statusCounts.in_stock },
              { id: 'low_stock', label: 'Low Stock', count: statusCounts.low_stock, alert: statusCounts.low_stock > 0 },
              { id: 'out_of_stock', label: 'Out of Stock', count: statusCounts.out_of_stock, urgent: statusCounts.out_of_stock > 0 },
              { id: 'archived', label: 'Archived', count: statusCounts.archived },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as StockFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-[#10222B] text-[#F2F6F7] shadow-xs'
                      : 'bg-[#F2F6F7] text-stone-700 hover:bg-[#E5ECEE]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.urgent 
                      ? 'bg-rose-500 text-white animate-pulse'
                      : tab.alert 
                      ? 'bg-amber-500 text-white'
                      : (active ? 'bg-[#1E3A47] text-[#77C7C6]' : 'bg-white text-stone-500')
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Operational Action Suite */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            
            {/* Place Restock Order Button */}
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => {
                const lowItems = inventory.filter(i => !i.isArchived && i.quantity <= i.minThreshold);
                const targets = lowItems.length > 0
                  ? lowItems.map(item => ({ item, suggestedQty: Math.max(10, Math.ceil((item.optimalParLevel || item.minThreshold * 2.5) - item.quantity)) }))
                  : inventory.slice(0, 4).map(item => ({ item, suggestedQty: 10 }));
                setOrderModalTargets(targets);
                setIsOrderModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] text-xs font-bold transition-all border border-[#D2DFE2] active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Create supplier purchase order in 'Ordered' status"
            >
              <Truck className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>+ Place Restock Order</span>
            </button>

            {/* Add New Product CTA */}
            <button
              onClick={onAddNewItem}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-all shadow-warm-sm active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#77C7C6]" />
              <span>+ Add Product</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Category Filter Chips */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
          
          {/* Category Filter Pills with Count Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#1B8585] text-white border-[#146868] font-bold shadow-xs'
                      : 'bg-white text-stone-700 border-[#D2DFE2] hover:bg-[#F2F6F7]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    active ? 'bg-[#146868] text-[#77C7C6]' : 'bg-[#F2F6F7] text-stone-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown & Direction */}
            <div className="flex items-center gap-1.5">
              <CustomSelect
                value={sortField as string}
                onChange={(val) => setSortField(val as keyof InventoryItem)}
                options={[
                  { value: 'name', label: 'Sort: Name' },
                  { value: 'quantity', label: 'Sort: Stock Level' },
                  { value: 'price', label: 'Sort: Price' },
                  { value: 'category', label: 'Sort: Category' }
                ]}
                buttonClassName="bg-[#F2F6F7] hover:bg-white min-w-[145px]"
              />

              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="p-2.5 rounded-xl bg-[#F2F6F7] hover:bg-white text-stone-600 hover:text-[#10222B] border border-[#D2DFE2] transition-all cursor-pointer shadow-2xs hover:border-[#1B8585]/40"
                title={sortAsc ? 'Ascending (A-Z, Low-High)' : 'Descending (Z-A, High-Low)'}
              >
                {sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-[#1B8585]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B8585]" />}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, Barcode, Name..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs text-[#10222B] placeholder:text-stone-400 focus:outline-none focus:border-[#1B8585] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* DIRECT SPREADSHEET TABLE VIEW */}
      <div className="bg-white rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2F6F7] border-b border-[#D2DFE2] text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-4 px-6 min-w-[280px]">Product & SKU / Barcode</th>
                <th className="py-4 px-5 min-w-[160px] whitespace-nowrap">Category</th>
                <th 
                  className="py-4 px-5 min-w-[180px] cursor-pointer hover:text-[#10222B] whitespace-nowrap"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    <span>Stock Quantity</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th 
                  className="py-4 px-5 min-w-[140px] cursor-pointer hover:text-[#10222B] whitespace-nowrap"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right min-w-[240px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D2DFE2]/50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-stone-400 font-medium">
                    No inventory products match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F2F6F7]/80 transition-colors group"
                    >
                      {/* Item SKU & Title */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-stone-400 uppercase">
                              {item.sku}
                            </span>
                            {item.barcode && (
                              <span className="font-mono text-[9px] bg-stone-100 text-stone-500 px-1 rounded">
                                🏷️ {item.barcode}
                              </span>
                            )}
                          </div>
                          <span className="font-serif font-bold text-sm text-[#10222B] block group-hover:text-[#1B8585] transition-colors leading-snug">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#F2F6F7] text-stone-700 text-xs font-semibold border border-[#D2DFE2] whitespace-nowrap shadow-2xs">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock Level with Inline Quick-Editor */}
                      <td className="py-4 px-5">
                        <InlineStockEditor
                          itemId={item.id}
                          value={item.quantity}
                          unit={item.unit}
                          onSave={updateStockQuantity}
                        />
                        <span className="text-[10px] text-stone-400 block mt-0.5 pl-2">
                          Min: {item.minThreshold} {item.unit} • Par: {item.optimalParLevel || (item.minThreshold * 2.5)} {item.unit}
                        </span>
                        {(() => {
                          const incomingQty = getIncomingQtyForItem(item.id);
                          const activeOrder = getActiveRestockOrderForItem(item.id);
                          if (incomingQty > 0 && activeOrder) {
                            return (
                              <div className="flex items-center gap-1.5 mt-1 pl-2">
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                  🚚 +{incomingQty} {item.unit} (PO #{activeOrder.orderNumber})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setReceivingOrder(activeOrder)}
                                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                                >
                                  Receive
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>

                      {/* Retail Price with Inline Quick-Editor */}
                      <td className="py-4 px-5">
                        <InlineStockEditor
                          itemId={item.id}
                          value={item.price}
                          isCurrency={true}
                          onSave={updatePrice}
                        />
                      </td>

                      {/* Actions Toolbar Pill */}
                      <td className="py-4 px-6 text-right min-w-[240px] whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 p-1 bg-[#F2F6F7] rounded-2xl border border-[#D2DFE2] shadow-2xs">
                          
                          {/* Quick Restock Symbol Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const suggestedQty = Math.max(5, Math.ceil((item.optimalParLevel || item.minThreshold * 2.5) - item.quantity));
                              setOrderModalTargets([{ item, suggestedQty }]);
                              setIsOrderModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-white hover:bg-[#10222B] text-[#1B8585] hover:text-white transition-all border border-[#D2DFE2] cursor-pointer shadow-2xs group"
                            title={`Quick Restock ${item.name}`}
                          >
                            <Truck className="w-3.5 h-3.5 text-[#1B8585] group-hover:text-white transition-colors" />
                          </button>

                          {/* Stock History Drawer Button */}
                          <button
                            onClick={() => setHistoryTargetItem(item)}
                            className="p-1.5 rounded-xl text-stone-500 hover:text-[#1B8585] hover:bg-white transition-colors"
                            title="View Stock Audit Trail History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Product */}
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 rounded-xl text-stone-500 hover:text-[#10222B] hover:bg-white transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Soft Delete / Restore Button */}
                          <button
                            onClick={() => toggleArchive(item.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isArchived 
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                                : 'text-stone-400 hover:text-amber-700 hover:bg-white'
                            }`}
                            title={item.isArchived ? 'Restore Product' : 'Archive Product'}
                          >
                            {item.isArchived ? <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>

                          {/* Permanent Purge (Hard Delete) */}
                          <button
                            onClick={() => handleDeletePrompt(item)}
                            className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Purge permanently from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Action Notice */}
      {tableNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-900 text-white text-xs font-semibold shadow-warm-2xl flex items-center gap-2 border border-emerald-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{tableNotice}</span>
        </div>
      )}

      {/* Stock History Drawer Modal */}
      <StockHistoryDrawer
        isOpen={!!historyTargetItem}
        item={historyTargetItem}
        onClose={() => setHistoryTargetItem(null)}
      />

      {/* Restock Order Modal (Status: Ordered) */}
      <RestockOrderModal
        isOpen={isOrderModalOpen}
        initialItems={orderModalTargets}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderNo) => {
          setTableNotice(`Restock Order #${orderNo} created! Status: Ordered / In Transit.`);
          setTimeout(() => setTableNotice(null), 4000);
        }}
      />

      {/* Receive Delivery Modal (Status: Received -> Stock Credited) */}
      <ReceiveDeliveryModal
        isOpen={!!receivingOrder}
        order={receivingOrder}
        onClose={() => setReceivingOrder(null)}
        onSuccess={() => {
          setTableNotice(`Delivery received! Physical inventory stock was credited.`);
          setTimeout(() => setTableNotice(null), 4000);
        }}
      />

      {/* Par-Level Supplier Purchase Order Modal */}
      <SupplierOrderModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
      />

      {/* Barcode & QR Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onOpenHistory={(item) => {
          setIsScannerModalOpen(false);
          setHistoryTargetItem(item);
        }}
      />

    </div>
  );
};
