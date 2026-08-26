import React, { useState, useMemo, useEffect } from 'react';
import { LiveOrder, OrderItemEntry } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatRelativeTime } from '../../utils/date';
import { exportOrdersSummaryPDF, exportSingleOrderInvoicePDF } from '../../utils/exportPdf';
import { exportDailyProfitToCSV } from '../../utils/exportCsv';
import { 
  ShoppingBag, 
  Search, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Coffee, 
  Layers, 
  LayoutGrid, 
  List, 
  Calendar, 
  User, 
  ArrowUpDown, 
  CreditCard, 
  ChevronRight, 
  X,
  Sparkles,
  Receipt,
  Eye,
  RotateCcw
} from 'lucide-react';

const INITIAL_SAMPLE_ORDERS: LiveOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 101,
    customerName: 'Ananya Sharma',
    items: [
      { menuItemId: 'm1', name: 'Madagascar Vanilla Flat White', quantity: 2, price: 340, customization: 'Oat Milk (Califia)' },
      { menuItemId: 'm3', name: 'Almond Frangipane Croissant', quantity: 1, price: 280 }
    ],
    total: 960,
    totalCostBasis: 245,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    completedAt: Date.now() - 1000 * 60 * 165,
    depletedIngredients: [
      { itemId: 'inv-1', itemName: 'Ethiopia Yirgacheffe Beans', amountDeducted: 0.036, unit: 'kg', unitCost: 1800 },
      { itemId: 'inv-4', itemName: 'Califia Barista Oat Milk', amountDeducted: 0.5, unit: 'L', unitCost: 320 }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 102,
    customerName: 'Rohan Mehta',
    items: [
      { menuItemId: 'm2', name: 'Kyoto 16-Hour Cold Drip', quantity: 1, price: 320 },
      { menuItemId: 'm6', name: 'Avocado & Truffle Poached Tartine', quantity: 1, price: 540 }
    ],
    total: 860,
    totalCostBasis: 210,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    completedAt: Date.now() - 1000 * 60 * 105,
    depletedIngredients: [
      { itemId: 'inv-2', itemName: 'Colombia Geisha Green Beans', amountDeducted: 0.025, unit: 'kg', unitCost: 3400 }
    ]
  },
  {
    id: 'ord-103',
    orderNumber: 103,
    customerName: 'Priya Iyer',
    items: [
      { menuItemId: 'm4', name: 'Iced Rose Cardamom Latte', quantity: 1, price: 360, customization: 'Almond Milk' },
      { menuItemId: 'm5', name: 'Ceremonial Matcha Croissant', quantity: 2, price: 310 }
    ],
    total: 980,
    totalCostBasis: 275,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    completedAt: Date.now() - 1000 * 60 * 45,
    depletedIngredients: [
      { itemId: 'inv-1', itemName: 'Ethiopia Yirgacheffe Beans', amountDeducted: 0.018, unit: 'kg', unitCost: 1800 },
      { itemId: 'inv-5', itemName: 'Almond Breeze Barista Milk', amountDeducted: 0.25, unit: 'L', unitCost: 290 }
    ]
  },
  {
    id: 'ord-104',
    orderNumber: 104,
    customerName: 'Dev Patel',
    items: [
      { menuItemId: 'm1', name: 'Cortado with House Panela', quantity: 1, price: 260 },
      { menuItemId: 'm7', name: 'Single-Origin Shakshuka Skillet', quantity: 1, price: 580 }
    ],
    total: 840,
    totalCostBasis: 230,
    status: 'ready',
    createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
    depletedIngredients: [
      { itemId: 'inv-1', itemName: 'Ethiopia Yirgacheffe Beans', amountDeducted: 0.018, unit: 'kg', unitCost: 1800 }
    ]
  },
  {
    id: 'ord-105',
    orderNumber: 105,
    customerName: 'Kavita Sen',
    items: [
      { menuItemId: 'm3', name: 'Cascara Berry Sparkling Tea', quantity: 2, price: 290 }
    ],
    total: 580,
    totalCostBasis: 120,
    status: 'preparing',
    createdAt: Date.now() - 1000 * 60 * 10, // 10 mins ago
    depletedIngredients: [
      { itemId: 'inv-3', itemName: 'Sumatra Mandheling Dark Roast', amountDeducted: 0.02, unit: 'kg', unitCost: 1450 }
    ]
  }
];

export const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<LiveOrder[]>(() => {
    const saved = localStorage.getItem('aura_live_orders');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'preparing' | 'ready' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('aura_live_orders', JSON.stringify(orders));
  }, [orders]);

  // Sync on window focus or storage change
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('aura_live_orders');
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setOrders(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // Status updates
  const handleUpdateStatus = (orderId: string, newStatus: LiveOrder['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          completedAt: newStatus === 'completed' ? Date.now() : o.completedAt
        };
      }
      return o;
    }));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus, completedAt: newStatus === 'completed' ? Date.now() : prev.completedAt } : null);
    }

    setActionNotice(`Order status updated to "${newStatus}".`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateFilter === 'today') {
        const orderDate = new Date(order.createdAt).toDateString();
        const today = new Date().toDateString();
        if (orderDate !== today) return false;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (order.createdAt < sevenDaysAgo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = String(order.orderNumber).includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesItem = order.items.some(i => i.name.toLowerCase().includes(q) || (i.customization || '').toLowerCase().includes(q));
        if (!matchesNum && !matchesName && !matchesItem) return false;
      }

      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, statusFilter, dateFilter, searchQuery]);

  // Executive Metrics
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
  const totalCogs = completedOrders.reduce((acc, o) => acc + (o.totalCostBasis || (o.total * 0.28)), 0);
  const netProfit = Math.max(0, totalRevenue - totalCogs);
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  // PDF Export Handlers
  const handleExportSummaryPDF = () => {
    exportOrdersSummaryPDF(filteredOrders, {
      title: 'Aura Coffee & Kitchen - Orders & Sales Master Statement',
      dateRangeLabel: dateFilter === 'today' ? "Today's Orders" : dateFilter === 'week' ? 'Last 7 Days' : 'All Time Orders'
    });
    setActionNotice('✓ Exported PDF Orders Statement.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportCSV = () => {
    exportDailyProfitToCSV({
      orders: filteredOrders,
      collectedRevenue: totalRevenue,
      completedItemsCount: totalItemsSold,
      totalCogs,
      netProfit,
      profitMarginPercent,
      averageOrderValue: aov
    });
    setActionNotice('✓ Exported Orders CSV Statement.');
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

      {/* Top Banner & Title */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#D2DFE2]/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
                  Orders & Sales Management
                </h2>
                <span className="px-3 py-1 rounded-full bg-[#EBF7F7] text-[#146868] text-xs font-bold border border-[#A3DEDE]">
                  {orders.length} Total Orders
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Inspect customer order details, monitor active kitchen tickets, and export official PDF invoices & sales reports.
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2F6F7] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Download Excel / CSV statement"
            >
              <FileText className="w-4 h-4 text-[#1B8585]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportSummaryPDF}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Generate and print/save master PDF orders report"
            >
              <Printer className="w-4 h-4 text-[#77C7C6]" />
              <span>Export Orders PDF</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Summary 4-Card Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Gross Revenue */}
          <div className="p-5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]/80 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Gross Revenue</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800">
              {formatCurrency(totalRevenue)}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              {completedOrders.length} Paid & Closed Tickets
            </span>
          </div>

          {/* Card 2: Average Order Value */}
          <div className="p-5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]/80 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Avg Ticket (AOV)</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {formatCurrency(aov)}
            </div>
            <span className="text-[11px] text-stone-500 block">
              {totalItemsSold} items fulfilled
            </span>
          </div>

          {/* Card 3: Est. Net Profit */}
          <div className="p-5 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] space-y-1.5">
            <span className="text-[10px] font-bold text-[#146868] uppercase tracking-wider block">Net Operating Profit</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {formatCurrency(netProfit)}
            </div>
            <span className="text-[11px] text-[#1B8585] font-bold block">
              Margin: {profitMarginPercent}%
            </span>
          </div>

          {/* Card 4: Active Kitchen Queue */}
          <div className="p-5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2]/80 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Active Queue</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-700">
              {orders.filter(o => o.status === 'preparing' || o.status === 'ready').length}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold block">
              {orders.filter(o => o.status === 'preparing').length} in prep, {orders.filter(o => o.status === 'ready').length} ready
            </span>
          </div>

        </div>

      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D2DFE2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'completed', label: `Completed (${completedOrders.length})` },
            { id: 'preparing', label: `Preparing (${orders.filter(o => o.status === 'preparing').length})` },
            { id: 'ready', label: `Ready (${orders.filter(o => o.status === 'ready').length})` },
            { id: 'cancelled', label: `Cancelled (${orders.filter(o => o.status === 'cancelled').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-[#10222B] shadow-2xs'
                  : 'text-stone-600 hover:text-[#10222B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Date Range, Search & View Switcher */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          
          {/* Date Scope Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F6F9FA] border border-[#D2DFE2] text-stone-700 focus:outline-none"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, item..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B8585]"
            />
          </div>

          {/* View Mode Toggle */}
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
              title="Data Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Orders View Rendering */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-[#D2DFE2] text-center text-stone-400 font-medium space-y-2">
          <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
          <p>No orders match the current status or search filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* VIEW 1: RICH ORDER CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isCompleted = order.status === 'completed';
            const isReady = order.status === 'ready';
            const isPreparing = order.status === 'preparing';
            const isCancelled = order.status === 'cancelled';
            const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-sm hover:shadow-warm-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-[#D2DFE2]/60 bg-[#F6F9FA]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-[#10222B]">
                      #{order.orderNumber}
                    </span>
                    <span className="text-stone-400">•</span>
                    <strong className="text-xs font-bold text-stone-800">{order.customerName}</strong>
                  </div>

                  {/* Status Pill */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isCompleted 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                      : isReady 
                      ? 'bg-sky-100 text-sky-900 border border-sky-200' 
                      : isCancelled 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : isPreparing ? <Clock className="w-3 h-3 text-amber-700" /> : null}
                    <span>{isCompleted ? 'Paid & Done' : isReady ? 'Ready' : isCancelled ? 'Cancelled' : 'Preparing'}</span>
                  </span>
                </div>

                {/* Card Body: Items List */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>{totalQty} items</span>
                  </div>

                  <div className="space-y-1.5 text-xs divide-y divide-[#D2DFE2]/40">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-[#10222B]">{item.quantity}x</strong> <span className="text-stone-800 font-medium">{item.name}</span>
                          {item.customization && (
                            <div className="text-[10px] text-stone-500 pl-4 italic">
                              ↳ {item.customization}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-stone-700 shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Depleted ingredients note */}
                  {order.depletedIngredients && order.depletedIngredients.length > 0 && (
                    <div className="text-[10px] text-[#1B8585] pt-2 border-t border-dashed border-[#D2DFE2] truncate">
                      Stock Deducted: {order.depletedIngredients.map(d => `${d.itemName} (-${d.amountDeducted}${d.unit})`).join(', ')}
                    </div>
                  )}
                </div>

                {/* Card Footer: Financials & Action Buttons */}
                <div className="p-4 bg-[#F8FAFB] border-t border-[#D2DFE2] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Total Amount</span>
                    <span className="font-mono font-bold text-base text-[#10222B]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* PDF Receipt Button */}
                    <button
                      type="button"
                      onClick={() => exportSingleOrderInvoicePDF(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#E5ECEE] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="Download PDF Tax Invoice / Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#1B8585]" />
                      <span>PDF Bill</span>
                    </button>

                    {/* View Details Modal */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#E5ECEE] text-stone-600 border border-[#D2DFE2] transition-colors cursor-pointer"
                      title="View complete order details"
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
                  <th className="py-4 px-6">Order #</th>
                  <th className="py-4 px-5">Customer</th>
                  <th className="py-4 px-5">Date & Time</th>
                  <th className="py-4 px-5">Items Summary</th>
                  <th className="py-4 px-4 text-center">Items Qty</th>
                  <th className="py-4 px-5 text-right">Total Amount</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2DFE2]/60">
                {filteredOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  const isReady = order.status === 'ready';
                  const isCancelled = order.status === 'cancelled';
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-[#F6F9FA] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#10222B]">
                        #{order.orderNumber}
                      </td>

                      <td className="py-4 px-5 font-bold text-stone-800">
                        {order.customerName}
                      </td>

                      <td className="py-4 px-5 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-4 px-5 text-stone-700 max-w-xs truncate">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-stone-700">
                        {totalQty}
                      </td>

                      <td className="py-4 px-5 text-right font-mono font-bold text-[#10222B]">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-900' 
                            : isReady 
                            ? 'bg-sky-100 text-sky-900' 
                            : isCancelled 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isCompleted ? 'Paid & Done' : isReady ? 'Ready' : isCancelled ? 'Cancelled' : 'Preparing'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportSingleOrderInvoicePDF(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] font-bold text-[11px] transition-colors border border-[#D2DFE2] cursor-pointer"
                            title="Export PDF Bill"
                          >
                            <Printer className="w-3 h-3 text-[#1B8585]" />
                            <span>PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#10222B] hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View Order Details"
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

      {/* Order Details Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            className="bg-[#F6F9FA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-warm-2xl border border-[#D2DFE2] my-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 bg-[#10222B] text-[#F2F6F7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center border border-[#1B8585]/40 shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Order #{selectedOrder.orderNumber} Details
                  </h3>
                  <p className="text-xs text-stone-300">
                    {selectedOrder.customerName} • Placed {formatRelativeTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Order Status Controller */}
              <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] flex items-center justify-between flex-wrap gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Current Order Status</span>
                  <div className="font-bold text-[#10222B] text-sm">
                    {selectedOrder.status === 'completed' ? '✅ Paid & Completed' : selectedOrder.status === 'ready' ? '🚚 Ready for Pickup' : selectedOrder.status === 'cancelled' ? '❌ Cancelled' : '⏳ Preparing in Kitchen'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedOrder.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Mark Paid & Completed
                    </button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                      className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 uppercase">Items Ordered</label>
                <div className="bg-white rounded-2xl border border-[#D2DFE2] overflow-hidden divide-y divide-[#D2DFE2]/60">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#10222B] text-sm">{item.quantity}x {item.name}</strong>
                        {item.customization && (
                          <div className="text-[11px] text-stone-500 italic mt-0.5">
                            Customization: {item.customization}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#10222B] block">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <span className="text-[10px] text-stone-400">{formatCurrency(item.price)} each</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredient Deduction Breakdown */}
              {selectedOrder.depletedIngredients && selectedOrder.depletedIngredients.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] space-y-1.5 text-xs">
                  <strong className="text-[#146868] font-bold block">Physical Ingredient Deductions:</strong>
                  <ul className="space-y-1 text-stone-700">
                    {selectedOrder.depletedIngredients.map((d, idx) => (
                      <li key={idx} className="flex justify-between text-[11px]">
                        <span>• {d.itemName}</span>
                        <span className="font-mono font-bold text-rose-700">-{d.amountDeducted} {d.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-white border border-[#D2DFE2] space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Gross Order Value:</span>
                  <span className="font-mono font-bold text-[#10222B]">{formatCurrency(selectedOrder.total)}</span>
                </div>
                {selectedOrder.totalCostBasis && (
                  <div className="flex justify-between text-stone-600">
                    <span>Estimated Recipe Cost Basis (COGS):</span>
                    <span className="font-mono text-stone-500">{formatCurrency(selectedOrder.totalCostBasis)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#D2DFE2] flex justify-between text-sm font-bold text-[#10222B]">
                  <span>Total Due / Collected:</span>
                  <span className="font-mono text-emerald-800 text-base">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 bg-[#F2F6F7] border-t border-[#D2DFE2] flex items-center justify-between">
              <button
                type="button"
                onClick={() => exportSingleOrderInvoicePDF(selectedOrder)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10222B] text-[#77C7C6] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF Tax Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-white border border-[#D2DFE2] text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
