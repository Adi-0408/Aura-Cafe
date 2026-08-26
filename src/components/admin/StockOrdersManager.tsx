import React, { useState, useMemo } from 'react';
import { RestockOrder, RestockOrderItem } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/currency';
import { formatRelativeTime } from '../../utils/date';
import { exportRestockOrdersSummaryPDF, exportSingleRestockOrderPDF } from '../../utils/exportPdf';
import { exportRestockOrdersToCSV } from '../../utils/exportCsv';
import { RestockOrderModal } from './RestockOrderModal';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { CustomSelect } from '../common/CustomSelect';
import { 
  Truck, 
  Search, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  PackageCheck, 
  Layers, 
  LayoutGrid, 
  List, 
  Calendar, 
  Building2, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Eye, 
  Receipt,
  Camera,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const StockOrdersManager: React.FC = () => {
  const { restockOrders, inventory, isSyncing, cancelRestockOrder } = useInventory();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'received' | 'cancelled'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<RestockOrder | null>(null);
  const [inspectOrder, setInspectOrder] = useState<RestockOrder | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Extract unique supplier names for filter
  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    restockOrders.forEach(o => {
      if (o.supplierName) set.add(o.supplierName);
    });
    return Array.from(set);
  }, [restockOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return restockOrders.filter(order => {
      // Status filter
      if (statusFilter === 'ordered' && order.status !== 'ordered' && order.status !== 'in_transit') {
        return false;
      }
      if (statusFilter === 'received' && order.status !== 'received') {
        return false;
      }
      if (statusFilter === 'cancelled' && order.status !== 'cancelled') {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== 'all' && order.supplierName !== supplierFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPO = order.orderNumber.toLowerCase().includes(q);
        const matchesSupplier = order.supplierName.toLowerCase().includes(q);
        const matchesInvoice = (order.deliveryInvoiceNo || '').toLowerCase().includes(q);
        const matchesOrderedBy = (order.orderedBy || '').toLowerCase().includes(q);
        const matchesReceivedBy = (order.receivedBy || '').toLowerCase().includes(q);
        const matchesItem = order.items.some(i => i.itemName.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q));

        if (!matchesPO && !matchesSupplier && !matchesInvoice && !matchesOrderedBy && !matchesReceivedBy && !matchesItem) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.orderedAt - a.orderedAt);
  }, [restockOrders, statusFilter, supplierFilter, searchQuery]);

  // Executive Metrics
  const totalPOAmount = restockOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const receivedOrdersCount = restockOrders.filter(o => o.status === 'received').length;
  const inTransitCount = restockOrders.filter(o => o.status === 'ordered' || o.status === 'in_transit').length;
  const totalGoodsUnits = restockOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantityOrdered, 0), 0);

  // PDF Export Handlers
  const handleExportSummaryPDF = () => {
    exportRestockOrdersSummaryPDF(filteredOrders, {
      title: 'Aura Coffee & Kitchen - Stock & Goods Purchase Orders Statement',
      statusFilter: statusFilter === 'all' ? 'All Purchase Orders' : statusFilter === 'ordered' ? 'Ordered / In Transit' : 'Delivered & Received'
    });
    setActionNotice('✓ Exported Stock Purchase Orders PDF Statement.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportCSV = () => {
    exportRestockOrdersToCSV(filteredOrders);
    setActionNotice('✓ Exported Stock Orders CSV Statement.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-900 text-white text-xs font-semibold shadow-warm-2xl flex items-center gap-2 border border-emerald-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#D2DFE2]/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
                  Stock & Goods Purchase Orders
                </h2>
                <span className="px-3 py-1 rounded-full bg-[#EBF7F7] text-[#146868] text-xs font-bold border border-[#A3DEDE]">
                  {restockOrders.length} Total POs
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Track supplier orders, inspect delivered goods & invoice proofs, and export official Purchase Order / GRN PDFs.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2F6F7] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Download Excel / CSV Statement"
            >
              <FileText className="w-4 h-4 text-[#1B8585]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportSummaryPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Generate and print/save master Stock Orders PDF report"
            >
              <Printer className="w-4 h-4 text-[#1B8585]" />
              <span>Export Orders PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#77C7C6]" />
              <span>+ Place Restock Order</span>
            </button>
          </div>
        </div>

        {/* Executive Procurement KPI 4-Card Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Total Spend */}
          <div className="p-5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]/80 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total PO Spend</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {formatCurrency(totalPOAmount)}
            </div>
            <span className="text-[11px] text-stone-500 block">
              Across {suppliersList.length} Active Suppliers
            </span>
          </div>

          {/* Card 2: In-Transit Deliveries */}
          <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">In-Transit / Ordered</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-900">
              {inTransitCount}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold block">
              Awaiting Physical Delivery Arrival
            </span>
          </div>

          {/* Card 3: Delivered & Received */}
          <div className="p-5 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] space-y-1.5">
            <span className="text-[10px] font-bold text-[#146868] uppercase tracking-wider block">Delivered & Stocked</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800">
              {receivedOrdersCount}
            </div>
            <span className="text-[11px] text-[#1B8585] font-bold block">
              Verified with Delivery Challans
            </span>
          </div>

          {/* Card 4: Total Goods Volume */}
          <div className="p-5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]/80 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Stock Volume</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {totalGoodsUnits.toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-500 block">
              Total Units / Kgs / Liters Ordered
            </span>
          </div>

        </div>

      </div>

      {/* Toolbar: Search, Status Tabs, Supplier Filter & View Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D2DFE2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `All POs (${restockOrders.length})` },
            { id: 'ordered', label: `In Transit (${inTransitCount})` },
            { id: 'received', label: `Delivered (${receivedOrdersCount})` },
            { id: 'cancelled', label: `Cancelled (${restockOrders.filter(o => o.status === 'cancelled').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-[#10222B] shadow-2xs'
                  : 'text-stone-600 hover:text-[#10222B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Supplier Filter & View Mode */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          
          {/* Supplier Dropdown */}
          <CustomSelect
            value={supplierFilter}
            onChange={(val) => setSupplierFilter(val)}
            options={[
              { value: 'all', label: 'All Suppliers' },
              ...suppliersList.map(s => ({ value: s, label: s }))
            ]}
            buttonClassName="bg-[#F6F9FA] hover:bg-white min-w-[160px]"
          />

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO #, supplier, goods, invoice..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B8585]"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-[#10222B] shadow-xs' : 'text-stone-500 hover:text-[#10222B]'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-[#10222B] shadow-xs' : 'text-stone-500 hover:text-[#10222B]'
              }`}
              title="Spreadsheet Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Orders View Rendering */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-[#D2DFE2] text-center text-stone-400 font-medium space-y-3">
          <Truck className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm">No stock purchase orders found matching your search or filters.</p>
          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10222B] text-white text-xs font-bold hover:bg-[#1E3A47]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Place New Restock Order</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* VIEW 1: RICH PURCHASE ORDER CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isReceived = order.status === 'received';
            const isCancelled = order.status === 'cancelled';
            const isInTransit = order.status === 'ordered' || order.status === 'in_transit';
            const totalQty = order.items.reduce((s, i) => s + i.quantityOrdered, 0);

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-sm hover:shadow-warm-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-[#D2DFE2]/60 bg-[#F6F9FA]/60 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-base text-[#10222B] block">
                      {order.orderNumber}
                    </span>
                    <strong className="text-xs text-stone-700 block truncate max-w-[200px]">
                      {order.supplierName}
                    </strong>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                    isReceived 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                      : isCancelled 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                  }`}>
                    {isReceived ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <Clock className="w-3 h-3 text-amber-700" />}
                    <span>{isReceived ? 'Delivered & Received' : isCancelled ? 'Cancelled' : 'In Transit'}</span>
                  </span>
                </div>

                {/* Card Body: Items List */}
                <div className="p-5 space-y-3.5 flex-1">
                  
                  {/* Timeline Row */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 bg-[#F8FAFB] p-2.5 rounded-xl border border-[#D2DFE2]/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>Ordered: {new Date(order.orderedAt).toLocaleDateString()}</span>
                    </div>
                    {isReceived && order.receivedAt ? (
                      <span className="text-emerald-800 font-semibold">
                        Rec: {new Date(order.receivedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold">
                        Exp: {order.expectedDeliveryDate || 'Standard 48hr'}
                      </span>
                    )}
                  </div>

                  {/* Itemized Goods */}
                  <div className="space-y-1.5 text-xs divide-y divide-[#D2DFE2]/40">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-[#10222B]">{item.quantityOrdered} {item.unit}</strong> <span className="text-stone-800">{item.itemName}</span>
                          {isReceived && item.quantityReceived !== undefined && (
                            <div className="text-[10px] text-emerald-700 font-medium">
                              Delivered: {item.quantityReceived} {item.unit}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-stone-700 shrink-0">
                          {formatCurrency(item.totalCost || (item.quantityOrdered * item.unitCost))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Invoice / Photo Info */}
                  <div className="pt-2 border-t border-dashed border-[#D2DFE2] flex items-center justify-between text-[11px] text-stone-500">
                    {order.deliveryInvoiceNo ? (
                      <span className="font-mono text-stone-700 font-semibold">
                        Challan: {order.deliveryInvoiceNo}
                      </span>
                    ) : (
                      <span className="italic text-stone-400">No invoice attached</span>
                    )}

                    {order.deliveryReceiptImageUrl && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                        <Camera className="w-3 h-3" />
                        <span>Live Photo Attached</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Card Footer: Financials & Action Buttons */}
                <div className="p-4 bg-[#F8FAFB] border-t border-[#D2DFE2] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">PO Value</span>
                    <span className="font-mono font-bold text-base text-[#10222B]">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* PDF Button */}
                    <button
                      type="button"
                      onClick={() => exportSingleRestockOrderPDF(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#E5ECEE] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="Download Official Purchase Order / GRN PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#1B8585]" />
                      <span>PDF PO</span>
                    </button>

                    {/* Receive Delivery CTA (if still in transit) */}
                    {isInTransit && (
                      <button
                        type="button"
                        onClick={() => setReceivingOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                        title="Receive shipment & credit physical stock"
                      >
                        Receive
                      </button>
                    )}

                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setInspectOrder(order)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#E5ECEE] text-stone-600 border border-[#D2DFE2] transition-colors cursor-pointer"
                      title="View complete PO details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        /* VIEW 2: HIGH-DENSITY SPREADSHEET TABLE VIEW */
        <div className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#10222B] text-white uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-4 px-6">PO #</th>
                  <th className="py-4 px-5">Supplier</th>
                  <th className="py-4 px-5">Ordered Date</th>
                  <th className="py-4 px-5">Goods & Restock Items</th>
                  <th className="py-4 px-5">Invoice / Challan</th>
                  <th className="py-4 px-5 text-right">Total Amount</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2DFE2]/60">
                {filteredOrders.map((order) => {
                  const isReceived = order.status === 'received';
                  const isCancelled = order.status === 'cancelled';
                  const isInTransit = order.status === 'ordered' || order.status === 'in_transit';

                  return (
                    <tr key={order.id} className="hover:bg-[#F6F9FA] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#10222B]">
                        {order.orderNumber}
                      </td>

                      <td className="py-4 px-5 font-bold text-stone-800">
                        {order.supplierName}
                      </td>

                      <td className="py-4 px-5 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(order.orderedAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-stone-700 max-w-xs truncate">
                        {order.items.map(i => `${i.quantityOrdered} ${i.unit} ${i.itemName}`).join(', ')}
                      </td>

                      <td className="py-4 px-5 font-mono text-stone-600 text-[11px]">
                        {order.deliveryInvoiceNo || '—'}
                      </td>

                      <td className="py-4 px-5 text-right font-mono font-bold text-[#10222B]">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isReceived 
                            ? 'bg-emerald-100 text-emerald-900' 
                            : isCancelled 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isReceived ? 'Delivered' : isCancelled ? 'Cancelled' : 'In Transit'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportSingleRestockOrderPDF(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] font-bold text-[11px] transition-colors border border-[#D2DFE2] cursor-pointer"
                            title="Export PDF PO"
                          >
                            <Printer className="w-3 h-3 text-[#1B8585]" />
                            <span>PDF</span>
                          </button>

                          {isInTransit && (
                            <button
                              type="button"
                              onClick={() => setReceivingOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Receive
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectOrder(order)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#10222B] hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View PO Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Inspection Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            className="bg-[#F6F9FA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-warm-2xl border border-[#D2DFE2] my-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center border border-[#1B8585]/40 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Purchase Order {inspectOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-stone-300">
                    {inspectOrder.supplierName} • Ordered by {inspectOrder.orderedBy}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectOrder(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Supplier & Delivery Info Grid */}
              <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Supplier Details</span>
                  <strong className="text-sm text-[#10222B] block">{inspectOrder.supplierName}</strong>
                  {inspectOrder.supplierPhone && <div className="text-stone-600 mt-0.5">Tel: {inspectOrder.supplierPhone}</div>}
                  {inspectOrder.supplierEmail && <div className="text-stone-600">Email: {inspectOrder.supplierEmail}</div>}
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Delivery & Status</span>
                  <div className="font-bold text-sm text-[#10222B] capitalize">
                    {inspectOrder.status === 'received' ? '✅ Delivered & Received' : inspectOrder.status === 'cancelled' ? '❌ Cancelled' : '⏳ Ordered / In Transit'}
                  </div>
                  <div className="text-stone-600 mt-0.5">Ordered: {new Date(inspectOrder.orderedAt).toLocaleDateString()}</div>
                  {inspectOrder.receivedAt && <div className="text-emerald-700 font-semibold">Received: {new Date(inspectOrder.receivedAt).toLocaleDateString()} by {inspectOrder.receivedBy}</div>}
                </div>
              </div>

              {/* Itemized Goods Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 uppercase">Ordered Goods & Materials</label>
                <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden divide-y divide-[#D2DFE2]/60">
                  {inspectOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#10222B] text-sm">{item.quantityOrdered} {item.unit} — {item.itemName}</strong>
                        {inspectOrder.status === 'received' && item.quantityReceived !== undefined && (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Delivered Count: {item.quantityReceived} {item.unit}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#10222B] block">
                          {formatCurrency(item.totalCost || (item.quantityOrdered * item.unitCost))}
                        </span>
                        <span className="text-[10px] text-stone-400">{formatCurrency(item.unitCost)}/{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Photo Proof if Available */}
              {inspectOrder.deliveryReceiptImageUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#1B8585]" />
                    Live Photo of Goods & Invoice Proof
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-[#D2DFE2] bg-stone-900 aspect-video max-h-52 flex items-center justify-center">
                    <img 
                      src={inspectOrder.deliveryReceiptImageUrl} 
                      alt="Delivered Goods Proof" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {inspectOrder.notes && (
                <div className="p-3.5 rounded-xl bg-[#F8FAFB] border border-[#D2DFE2] text-xs text-stone-600">
                  <strong className="text-stone-800 block mb-0.5">Inspection Notes:</strong>
                  {inspectOrder.notes}
                </div>
              )}

              {/* Total Amount */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-sm font-bold text-emerald-950">
                <span>Total Purchase Order Value:</span>
                <span className="font-serif text-xl">{formatCurrency(inspectOrder.totalAmount)}</span>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 bg-[#F2F6F7] border-t border-[#D2DFE2] flex items-center justify-between">
              <button
                type="button"
                onClick={() => exportSingleRestockOrderPDF(inspectOrder)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10222B] text-[#77C7C6] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PO / GRN (PDF)</span>
              </button>

              <div className="flex items-center gap-2">
                {(inspectOrder.status === 'ordered' || inspectOrder.status === 'in_transit') && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = inspectOrder;
                      setInspectOrder(null);
                      setReceivingOrder(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Receive Delivery
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setInspectOrder(null)}
                  className="px-5 py-2 rounded-xl bg-white border border-[#D2DFE2] text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Place Restock Order Modal */}
      <RestockOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderNo) => {
          setActionNotice(`Purchase Order #${orderNo} created! Status: Ordered / In Transit.`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* Receive Delivery Modal */}
      <ReceiveDeliveryModal
        isOpen={!!receivingOrder}
        order={receivingOrder}
        onClose={() => setReceivingOrder(null)}
        onSuccess={() => {
          setActionNotice('Delivery received! Physical inventory stock was credited.');
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

    </div>
  );
};
