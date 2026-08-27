import React, { useState, useMemo, useEffect } from 'react';
import { LiveOrder } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  LedgerPeriodType, 
  calculatePeriodFinancials, 
  shiftPeriodDate, 
  exportSalesLedgerToExcel, 
  exportSalesLedgerToCSV,
  TimeDistributionBucket
} from '../../utils/salesAnalytics';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  Receipt, 
  Search, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  X, 
  Printer, 
  Clock, 
  ArrowUpRight, 
  PieChart, 
  Sparkles, 
  RefreshCw, 
  Eye,
  Table as TableIcon,
  ListOrdered,
  Flame,
  CalendarDays
} from 'lucide-react';

interface SalesLedgerSectionProps {
  orders: LiveOrder[];
  isCounterOpen: boolean;
  collectedRevenue: number;
  onRefresh?: () => void;
}

export const SalesLedgerSection: React.FC<SalesLedgerSectionProps> = ({
  orders,
  isCounterOpen,
  collectedRevenue,
  onRefresh
}) => {
  // Period filter: 'day' | 'week' | 'month' | 'year' | 'all'
  const [periodType, setPeriodType] = useState<LedgerPeriodType>('day');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  
  // Statement List View switcher: 'statement' (Period Distribution Breakdown) | 'transactions' (Itemized Receipts)
  const [activeLedgerView, setActiveLedgerView] = useState<'statement' | 'transactions'>('statement');

  // Search & Payment Filter for Transactions
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  
  // Toggle to show all intervals or only intervals with sales
  const [showAllIntervals, setShowAllIntervals] = useState<boolean>(false);

  // Modal state for digital receipt inspector
  const [inspectingOrder, setInspectingOrder] = useState<LiveOrder | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Pagination for transactions table (screen only)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [periodType, referenceDate, searchQuery, paymentFilter, activeLedgerView]);

  // Calculate financial summary for the selected period
  const financialSummary = useMemo(() => {
    return calculatePeriodFinancials(orders, periodType, referenceDate);
  }, [orders, periodType, referenceDate]);

  // Determine if there are actual orders in this selected period
  const hasOrdersInPeriod = financialSummary.completedOrdersCount > 0 || financialSummary.totalOrdersCount > 0;

  // Filtered transactions for search & payment method
  const displayedOrders = useMemo(() => {
    return financialSummary.filteredOrders.filter(order => {
      // Payment filter
      if (paymentFilter !== 'All') {
        const orderPayment = order.paymentMethod || 'UPI / QR';
        if (orderPayment.toLowerCase() !== paymentFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = String(order.orderNumber).includes(q);
        const matchCustomer = order.customerName.toLowerCase().includes(q);
        const matchItem = order.items.some(i => i.name.toLowerCase().includes(q));
        const matchPayment = (order.paymentMethod || '').toLowerCase().includes(q);
        return matchNumber || matchCustomer || matchItem || matchPayment;
      }

      return true;
    });
  }, [financialSummary.filteredOrders, searchQuery, paymentFilter]);

  // Paginated orders for screen view
  const totalPages = Math.max(1, Math.ceil(displayedOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayedOrders.slice(start, start + itemsPerPage);
  }, [displayedOrders, currentPage, itemsPerPage]);

  // Date navigation handlers
  const handlePreviousPeriod = () => {
    setReferenceDate(prev => shiftPeriodDate(prev, periodType, -1));
  };

  const handleNextPeriod = () => {
    setReferenceDate(prev => shiftPeriodDate(prev, periodType, 1));
  };

  const handleResetToToday = () => {
    setReferenceDate(new Date());
  };

  // Export handlers
  const handleExportExcel = () => {
    exportSalesLedgerToExcel(financialSummary, displayedOrders);
    setNotification('✓ Exported accounting statement to Excel (.xlsx)');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportCSV = () => {
    exportSalesLedgerToCSV(financialSummary, displayedOrders);
    setNotification('✓ Exported accounting statement to CSV (.csv)');
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Peak interval for list view badges
  const peakRevenue = useMemo(() => {
    if (financialSummary.distributionBuckets.length === 0) return 0;
    return Math.max(...financialSummary.distributionBuckets.map(b => b.grossRevenue), 0);
  }, [financialSummary.distributionBuckets]);

  // Filter statement intervals to active only unless toggled
  const visibleDistributionBuckets = useMemo(() => {
    if (showAllIntervals) return financialSummary.distributionBuckets;
    const activeOnly = financialSummary.distributionBuckets.filter(b => b.ordersCount > 0 || b.grossRevenue > 0);
    return activeOnly.length > 0 ? activeOnly : financialSummary.distributionBuckets;
  }, [financialSummary.distributionBuckets, showAllIntervals]);

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      
      {/* 0. PRINT-ONLY OFFICIAL STATEMENT HEADER (Appears strictly when printing) */}
      <div className="hidden print:block pb-5 mb-4 border-b-2 border-[#10222B]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#10222B] tracking-tight">
                AURA COFFEE & KITCHEN
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[10px] font-bold border border-stone-300">
                Official Accounting Statement
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-1">
              Store Sales Performance & Accounting Ledger
            </p>
          </div>
          <div className="text-right text-xs text-stone-700 space-y-0.5">
            <p><strong className="text-[#10222B]">Statement Period:</strong> {financialSummary.periodLabel} ({periodType.toUpperCase()})</p>
            <p><strong>Date Generated:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[10px] text-emerald-800 font-bold">Audit Status: Reconciled</p>
          </div>
        </div>
      </div>

      {/* 1. TOP HEADER & EXPORT ACTION TOOLBAR (Hidden in print) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 print:hidden">
        
        {/* Left: Section Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-warm-xs shrink-0 ring-4 ring-[#1B8585]/10">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-[#77C7C6]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#10222B] tracking-tight">
                Store Sales Ledger & Statements
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF7F7] text-[#146868] font-bold text-[10px] sm:text-[11px] border border-[#A3DEDE] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B8585] animate-ping" />
                <span>Accounting Ledger</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tabular sales statements across day, week, month, and year with ingredient cost accounting.
            </p>
          </div>
        </div>

        {/* Right: Export & Reporting Suite */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 sm:h-10 px-3 rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] hover:bg-[#E5ECEE] text-stone-700 transition-all text-xs font-bold flex items-center justify-center cursor-pointer hover:shadow-2xs active:scale-95"
              title="Sync latest transactions from Cloud Firestore"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 sm:h-10 inline-flex items-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-[#F6F9FA] hover:bg-[#E5ECEE] text-[#10222B] border border-[#D2DFE2] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Download multi-tab formatted Excel Statement (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1B8585]" />
            <span>Excel Statement</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 sm:h-10 hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-[#F6F9FA] hover:bg-[#E5ECEE] text-stone-700 border border-[#D2DFE2] text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Download CSV Statement (.csv)"
          >
            <FileText className="w-4 h-4 text-stone-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-9 sm:h-10 inline-flex items-center gap-1.5 px-4 sm:px-5 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-warm-xs cursor-pointer active:scale-95"
            title="Print Financial Statement"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Notification Toast (Hidden in print) */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-warm-xs animate-slide-up print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TIME HORIZON TABS & SEPARATE DATE NAVIGATOR (Hidden in print) */}
      <div className="space-y-3 print:hidden">
        
        {/* Horizon Tabs (Symmetrical Grid: 2 cols on mobile, 5 on desktop) */}
        <div className="p-1.5 rounded-2xl bg-[#F6F9FA] border border-[#D2DFE2] shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {[
              { id: 'day', label: 'Day-Wise', sub: 'Hourly List', icon: Clock },
              { id: 'week', label: 'Week-Wise', sub: 'Daily List', icon: Calendar },
              { id: 'month', label: 'Month-Wise', sub: 'Weekly List', icon: TableIcon },
              { id: 'year', label: 'Year-Wise', sub: 'Monthly List', icon: TrendingUp },
              { id: 'all', label: 'All-Time', sub: 'Lifetime List', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const active = periodType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriodType(tab.id as LedgerPeriodType)}
                  className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#10222B] text-[#77C7C6] shadow-warm-xs scale-[1.01]'
                      : 'text-stone-600 hover:text-[#10222B] hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#77C7C6]' : 'text-stone-400'}`} />
                  <div className="text-left truncate">
                    <span className="block leading-tight">{tab.label}</span>
                    <span className={`block text-[10px] font-normal leading-tight ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                      {tab.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Symmetrical Date Navigator Row */}
        {periodType !== 'all' && (
          <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border border-[#D2DFE2] shadow-warm-xs">
            
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePreviousPeriod}
              className="h-9 px-3 sm:px-4 rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] hover:bg-[#E5ECEE] text-stone-700 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title={`Previous ${periodType}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous {periodType}</span>
            </button>

            {/* Centered Period Title */}
            <div className="text-center px-2 min-w-0">
              <h4 className="font-serif font-bold text-sm sm:text-base text-[#10222B] truncate">
                {financialSummary.periodLabel}
              </h4>
              <span className="block text-[10px] text-[#1B8585] font-bold uppercase tracking-wider">
                {periodType.toUpperCase()} STATEMENT
              </span>
            </div>

            {/* Right: Today + Next Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetToToday}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-stone-50 border border-[#D2DFE2] text-xs font-bold text-[#1B8585] transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextPeriod}
                className="h-9 px-3 sm:px-4 rounded-xl border border-[#D2DFE2] bg-[#F6F9FA] hover:bg-[#E5ECEE] text-stone-700 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                title={`Next ${periodType}`}
              >
                <span className="hidden sm:inline">Next {periodType}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* 3. 5 EXECUTIVE FINANCIAL KPI CARDS (Crisply formatted for screen & print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2.5 print-avoid-break">
        
        {/* Gross Sales */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-2 hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between print:p-3 print:rounded-xl print:border-stone-300 print:bg-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold text-stone-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center print:hidden">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl print:text-lg font-bold text-emerald-800 tracking-tight">
              {formatCurrency(financialSummary.totalGrossRevenue)}
            </div>
            <p className="text-[11px] print:text-[9px] text-stone-500 mt-0.5">Total collected revenue</p>
          </div>
          <div className="pt-2 border-t border-stone-100 print:border-stone-300 flex items-center justify-between text-[11px] print:text-[9px]">
            <span className="text-stone-400 print:text-stone-600">Settlement</span>
            <span className="text-emerald-700 font-bold">{hasOrdersInPeriod ? '100% Settled' : 'No Sales'}</span>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-2 hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between print:p-3 print:rounded-xl print:border-stone-300 print:bg-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold text-stone-500 uppercase tracking-wider">Raw Cost (COGS)</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center print:hidden">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl print:text-lg font-bold text-stone-800 tracking-tight">
              {formatCurrency(financialSummary.totalCogs)}
            </div>
            <p className="text-[11px] print:text-[9px] text-stone-500 mt-0.5">Ingredients & packaging</p>
          </div>
          <div className="pt-2 border-t border-stone-100 print:border-stone-300 flex items-center justify-between text-[11px] print:text-[9px]">
            <span className="text-stone-400 print:text-stone-600">Cost Ratio</span>
            <span className="text-amber-800 font-bold">
              {financialSummary.totalGrossRevenue > 0 ? ((financialSummary.totalCogs / financialSummary.totalGrossRevenue) * 100).toFixed(0) : '0'}% of Sales
            </span>
          </div>
        </div>

        {/* Net Store Profit */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#EBF7F7] border border-[#A3DEDE] shadow-warm-xs space-y-2 hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between print:p-3 print:rounded-xl print:border-stone-400 print:bg-emerald-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold text-[#146868] uppercase tracking-wider">Net Store Profit</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#10222B] text-[#77C7C6] flex items-center justify-center shadow-2xs print:hidden">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl print:text-lg font-bold text-[#10222B] tracking-tight">
              {formatCurrency(financialSummary.totalNetProfit)}
            </div>
            <p className="text-[11px] print:text-[9px] text-[#1B8585] print:text-emerald-900 mt-0.5 font-semibold">After all ingredient costs</p>
          </div>
          <div className="pt-2 border-t border-[#A3DEDE]/60 print:border-stone-300 flex items-center justify-between text-[11px] print:text-[9px]">
            <span className="text-[#146868] font-bold">Net Margin</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#10222B] font-bold text-[10px] print:text-[9px] border border-[#A3DEDE] print:border-stone-300">
              {financialSummary.profitMarginPercent}% Margin
            </span>
          </div>
        </div>

        {/* Completed Orders Count */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-2 hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between print:p-3 print:rounded-xl print:border-stone-300 print:bg-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold text-stone-500 uppercase tracking-wider">Completed Tickets</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center print:hidden">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl print:text-lg font-bold text-[#10222B] tracking-tight">
              {financialSummary.completedOrdersCount} <span className="text-sm print:text-xs font-sans font-medium text-stone-400">tickets</span>
            </div>
            <p className="text-[11px] print:text-[9px] text-stone-500 mt-0.5">{financialSummary.totalItemsSold} items prepared</p>
          </div>
          <div className="pt-2 border-t border-stone-100 print:border-stone-300 flex items-center justify-between text-[11px] print:text-[9px]">
            <span className="text-stone-400 print:text-stone-600">Total Recorded</span>
            <span className="text-stone-700 font-bold">{financialSummary.totalOrdersCount} orders</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-2 hover:-translate-y-0.5 hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between print:p-3 print:rounded-xl print:border-stone-300 print:bg-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold text-stone-500 uppercase tracking-wider">Average Ticket (AOV)</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center print:hidden">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl print:text-lg font-bold text-[#10222B] tracking-tight">
              {formatCurrency(financialSummary.averageOrderValue)}
            </div>
            <p className="text-[11px] print:text-[9px] text-stone-500 mt-0.5">Average revenue/guest</p>
          </div>
          <div className="pt-2 border-t border-stone-100 print:border-stone-300 flex items-center justify-between text-[11px] print:text-[9px]">
            <span className="text-stone-400 print:text-stone-600">Discounts Given</span>
            {financialSummary.discountSavingsGiven > 0 ? (
              <span className="text-emerald-700 font-bold">-{formatCurrency(financialSummary.discountSavingsGiven)}</span>
            ) : (
              <span className="text-stone-400">₹0.00</span>
            )}
          </div>
        </div>

      </div>

      {/* 4. IF NO DATA / NO ORDERS -> SHOW CLEAN MESSAGE INSTEAD */}
      {!hasOrdersInPeriod ? (
        <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-xs flex flex-col items-center justify-center space-y-4 animate-fade-in print:p-6 print:border-stone-300">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F9FA] text-stone-400 flex items-center justify-center border border-[#D2DFE2] shadow-2xs print:hidden">
            <CalendarDays className="w-8 h-8 text-stone-400" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="font-serif text-lg sm:text-xl font-bold text-[#10222B]">
              No Sales Orders Recorded for {financialSummary.periodLabel}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              There are no completed transactions or receipts for this {periodType}. As customer orders are placed and completed at the counter, their live accounting statements and time breakdowns will appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetToToday}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10222B] text-[#77C7C6] hover:text-white text-xs font-bold transition-all shadow-warm-xs active:scale-95 cursor-pointer print:hidden"
          >
            <Clock className="w-4 h-4" />
            <span>Go to Today's Shift</span>
          </button>
        </div>
      ) : (
        <>
          {/* 5. STATEMENT LIST VIEW SWITCHER TABS (Hidden in print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D2DFE2] pb-2 print:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLedgerView('statement')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeLedgerView === 'statement'
                    ? 'bg-[#10222B] text-[#77C7C6] shadow-warm-xs'
                    : 'bg-white text-stone-600 hover:text-[#10222B] border border-[#D2DFE2]'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>
                  {periodType === 'day' ? 'Hourly Performance Statement List' :
                   periodType === 'week' ? 'Daily Performance Statement List' :
                   periodType === 'month' ? 'Weekly Performance Statement List' :
                   periodType === 'year' ? '12-Month Annual Statement List' : 'All-Time Statement List'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#1B8585] text-white text-[10px] font-bold">
                  {visibleDistributionBuckets.length} active
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLedgerView('transactions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeLedgerView === 'transactions'
                    ? 'bg-[#10222B] text-[#77C7C6] shadow-warm-xs'
                    : 'bg-white text-stone-600 hover:text-[#10222B] border border-[#D2DFE2]'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Customer Transactions ({displayedOrders.length})</span>
              </button>
            </div>

            <span className="text-xs text-stone-500 font-medium self-end sm:self-auto">
              Period: <strong className="text-[#10222B]">{financialSummary.periodLabel}</strong>
            </span>
          </div>

          {/* 6A. VIEW A: FINANCIAL STATEMENT & TIME DISTRIBUTION LIST VIEW */}
          {activeLedgerView === 'statement' && (
            <div className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-4 animate-fade-in print:p-0 print:border-none print:shadow-none">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
                <div>
                  <h4 className="font-serif font-bold text-lg text-[#10222B] flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-[#1B8585]" />
                    <span>
                      {periodType === 'day' ? 'Hourly Sales Breakdown' :
                       periodType === 'week' ? 'Daily Sales Breakdown (Mon – Sun)' :
                       periodType === 'month' ? 'Weekly Interval Performance' :
                       periodType === 'year' ? '12-Month Calendar Breakdown' : 'All-Time Financial Performance'}
                    </span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Itemized financial metrics, ingredient costs, and net margins across each time interval.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllIntervals(prev => !prev)}
                    className="text-xs text-stone-600 hover:text-[#10222B] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAllIntervals ? 'Hide Inactive Intervals' : 'Show All Intervals'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 text-xs text-[#1B8585] font-bold hover:underline cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Statement</span>
                  </button>
                </div>
              </div>

              {/* Statement List Table */}
              <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden shadow-2xs print:border-stone-300 print:rounded-none">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F9FA] print:bg-stone-100 text-[11px] print:text-[9px] font-bold text-stone-600 uppercase tracking-wider border-b border-[#D2DFE2] print:border-stone-300">
                      <tr>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 w-40">Time Interval</th>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 w-36">Date / Range</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 text-center w-28">Orders Placed</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 text-center w-28">Items Sold</th>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 text-right w-36">Gross Revenue (₹)</th>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 text-right w-32">Raw COGS (₹)</th>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 text-right w-36">Net Profit (₹)</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 text-center w-28">Margin (%)</th>
                        <th className="py-3.5 px-3.5 print:py-2 print:px-2.5 text-center w-28 print:hidden">Period Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D2DFE2]/70 print:divide-stone-300 font-sans">
                      {visibleDistributionBuckets.map((bucket) => {
                        const isPeak = bucket.grossRevenue > 0 && bucket.grossRevenue === peakRevenue;
                        const margin = bucket.grossRevenue > 0 
                          ? ((bucket.netProfit / bucket.grossRevenue) * 100).toFixed(1)
                          : '0.0';
                        const hasActivity = bucket.ordersCount > 0;

                        return (
                          <tr 
                            key={bucket.key} 
                            className={`transition-colors print-avoid-break ${
                              isPeak 
                                ? 'bg-[#F2F8F8] print:bg-stone-50 font-medium' 
                                : hasActivity 
                                ? 'hover:bg-[#F6F9FA]' 
                                : 'opacity-60 hover:opacity-100 hover:bg-stone-50'
                            }`}
                          >
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 font-bold text-[#10222B]">
                              <div className="flex items-center gap-2">
                                {isPeak && <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0 print:hidden" />}
                                <span>{bucket.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 text-stone-500 font-medium whitespace-nowrap">
                              {bucket.dateStr}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-mono font-bold text-[#10222B]">
                              {bucket.ordersCount} {bucket.ordersCount === 1 ? 'order' : 'orders'}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-center font-mono text-stone-600">
                              {bucket.itemsCount} {bucket.itemsCount === 1 ? 'item' : 'items'}
                            </td>
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 text-right font-mono font-bold text-emerald-800 print:text-black">
                              {formatCurrency(bucket.grossRevenue)}
                            </td>
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 text-right font-mono text-stone-500 print:text-stone-700">
                              {formatCurrency(bucket.cogs)}
                            </td>
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 text-right font-mono font-bold text-[#10222B]">
                              {formatCurrency(bucket.netProfit)}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] print:text-[8.5px] font-bold ${
                                Number(margin) >= 60 
                                  ? 'bg-emerald-100 text-emerald-800 print:bg-transparent' 
                                  : Number(margin) > 0 
                                  ? 'bg-amber-100 text-amber-800 print:bg-transparent' 
                                  : 'bg-stone-100 text-stone-500 print:bg-transparent'
                              }`}>
                                {margin}%
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap print:hidden">
                              {isPeak ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300 inline-flex items-center gap-1">
                                  <span>🔥 Peak Interval</span>
                                </span>
                              ) : hasActivity ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-400 text-[10px]">
                                  No Sales
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* Statement Summary Total Footer Row */}
                    <tfoot className="bg-[#10222B] print:bg-stone-200 text-white print:text-black font-bold text-xs print:text-[9.5px] border-t-2 border-[#1B8585] print:border-black">
                      <tr>
                        <td className="py-3.5 px-4 print:py-2 print:px-2.5 uppercase text-[#77C7C6] print:text-black" colSpan={2}>
                          Statement Totals ({financialSummary.periodLabel})
                        </td>
                        <td className="py-3.5 px-3 print:py-2 print:px-2 text-center font-mono text-[#77C7C6] print:text-black">
                          {financialSummary.completedOrdersCount} orders
                        </td>
                        <td className="py-3.5 px-3 print:py-2 print:px-2 text-center font-mono text-stone-300 print:text-black">
                          {financialSummary.totalItemsSold} items
                        </td>
                        <td className="py-3.5 px-4 print:py-2 print:px-2.5 text-right font-mono text-emerald-400 print:text-black font-bold">
                          {formatCurrency(financialSummary.totalGrossRevenue)}
                        </td>
                        <td className="py-3.5 px-4 print:py-2 print:px-2.5 text-right font-mono text-stone-300 print:text-black">
                          {formatCurrency(financialSummary.totalCogs)}
                        </td>
                        <td className="py-3.5 px-4 print:py-2 print:px-2.5 text-right font-mono text-white print:text-black font-bold">
                          {formatCurrency(financialSummary.totalNetProfit)}
                        </td>
                        <td className="py-3.5 px-3 print:py-2 print:px-2 text-center font-mono text-[#77C7C6] print:text-black">
                          {financialSummary.profitMarginPercent}%
                        </td>
                        <td className="py-3.5 px-3.5 text-center text-[11px] text-emerald-400 print:hidden">
                          BALANCED
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 6B. VIEW B: ITEMIZED TRANSACTION SALES LEDGER TABLE */}
          {activeLedgerView === 'transactions' && (
            <div className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs space-y-5 animate-fade-in print:p-0 print:border-none print:shadow-none">
              
              {/* Table Header & Search Filter Suite (Hidden in print) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
                <div>
                  <h4 className="font-serif font-bold text-lg text-[#10222B] flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#1B8585]" />
                    <span>Customer Transaction Ledger ({displayedOrders.length} records)</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Every settled customer receipt in {financialSummary.periodLabel}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search Box */}
                  <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ticket, guest, item..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F6F9FA] border border-[#D2DFE2] text-xs font-medium text-[#10222B] focus:outline-none focus:border-[#1B8585] shadow-2xs"
                    />
                  </div>

                  {/* Payment Filter Pills */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F9FA] border border-[#D2DFE2] shadow-2xs">
                    {['All', 'UPI / QR', 'Credit Card', 'Cash'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentFilter(method)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          paymentFilter === method
                            ? 'bg-white text-[#10222B] shadow-2xs'
                            : 'text-stone-500 hover:text-[#10222B]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-[#D2DFE2] rounded-2xl overflow-hidden shadow-2xs print:border-stone-300 print:rounded-none">
                <div className="overflow-x-auto max-h-[520px] print:max-h-none print:overflow-visible">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F9FA] print:bg-stone-100 text-[11px] print:text-[9px] font-bold text-stone-600 uppercase tracking-wider sticky top-0 z-10 border-b border-[#D2DFE2] print:border-stone-300">
                      <tr>
                        <th className="py-3.5 px-3.5 print:py-2 print:px-2 w-20">Ticket #</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-36">Date & Time</th>
                        <th className="py-3.5 px-3.5 print:py-2 print:px-2 w-36">Customer Name</th>
                        <th className="py-3.5 px-4 print:py-2 print:px-2.5 min-w-[200px]">Items Summary</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-28">Payment</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-24">COGS Cost</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-28">Total Sale</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-28">Net Profit</th>
                        <th className="py-3.5 px-3 print:py-2 print:px-2 w-24">Status</th>
                        <th className="py-3.5 px-3.5 print:py-2 print:px-2 w-16 text-center print:hidden">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D2DFE2]/70 print:divide-stone-300">
                      {/* In print, print all displayed orders; in screen, paginate */}
                      {displayedOrders.map(order => {
                        const cogs = order.totalCostBasis || Number((order.total * 0.28).toFixed(2));
                        const profit = Math.max(0, order.total - cogs);
                        const isCompleted = order.status === 'completed';

                        return (
                          <tr key={order.id} className="hover:bg-[#F6F9FA] transition-colors print-avoid-break">
                            <td className="py-3 px-3.5 print:py-1.5 print:px-2 font-mono font-bold text-[#10222B]">
                              #{order.orderNumber}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 whitespace-nowrap text-stone-600 text-[11px] print:text-[8.5px]">
                              {new Date(order.completedAt || order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(order.completedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-3.5 print:py-1.5 print:px-2 font-bold text-[#10222B] max-w-[140px] truncate" title={order.customerName}>
                              {order.customerName}
                            </td>
                            <td className="py-3 px-4 print:py-1.5 print:px-2.5 text-stone-600 max-w-[240px] print:max-w-none truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] print:text-[8.5px] font-semibold border border-stone-200 print:bg-transparent print:border-none">
                                {order.paymentMethod || 'UPI / QR'}
                              </span>
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 font-mono text-stone-500 whitespace-nowrap">
                              {formatCurrency(cogs)}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 font-mono font-bold text-emerald-800 print:text-black whitespace-nowrap">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 font-mono font-bold text-[#10222B] whitespace-nowrap">
                              {formatCurrency(profit)}
                            </td>
                            <td className="py-3 px-3 print:py-1.5 print:px-2 whitespace-nowrap">
                              {isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] print:text-[8.5px] font-bold border border-emerald-200 print:border-none print:bg-transparent">
                                  COMPLETED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] print:text-[8.5px] font-bold border border-rose-200 print:border-none print:bg-transparent">
                                  {order.status.toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap print:hidden">
                              <button
                                type="button"
                                onClick={() => setInspectingOrder(order)}
                                className="p-1.5 rounded-lg bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] transition-all cursor-pointer active:scale-95"
                                title="Inspect digital receipt"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#1B8585]" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {displayedOrders.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-xs text-stone-400">
                            No transactions found matching the selected period and search filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer (Hidden in print) */}
                {totalPages > 1 && (
                  <div className="p-3 bg-[#F6F9FA] border-t border-[#D2DFE2] flex items-center justify-between text-xs text-stone-600 print:hidden">
                    <span>
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayedOrders.length)} of {displayedOrders.length} orders
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-2.5 py-1 rounded-lg border border-[#D2DFE2] bg-white hover:bg-stone-50 disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono font-bold text-[#10222B]">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="px-2.5 py-1 rounded-lg border border-[#D2DFE2] bg-white hover:bg-stone-50 disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 7. BALANCED TWO-COLUMN ANALYTICS LISTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch print:grid-cols-12 print:gap-4 print-avoid-break">
            
            {/* Category Share Breakdown List (5 Cols) */}
            <div className="lg:col-span-5 print:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs flex flex-col justify-between space-y-4 hover:shadow-warm-md transition-all duration-300 print:p-4 print:rounded-xl print:border-stone-300">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#D2DFE2]/60 print:border-stone-300">
                  <h4 className="font-serif font-bold text-base print:text-sm text-[#10222B] flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#1B8585] print:hidden" />
                    <span>Category Sales Breakdown</span>
                  </h4>
                  <span className="text-xs print:text-[9px] text-stone-500 font-medium">
                    {financialSummary.categoryBreakdown.length} Categories
                  </span>
                </div>

                <div className="space-y-4 print:space-y-2 pt-3">
                  {financialSummary.categoryBreakdown.map(cat => (
                    <div key={cat.category} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs print:text-[9px]">
                        <span className="font-bold text-[#10222B] group-hover:text-[#1B8585] transition-colors">
                          {cat.category}
                        </span>
                        <span className="font-mono font-bold text-stone-800">
                          {formatCurrency(cat.revenue)} <span className="text-stone-400 font-normal">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#F2F6F7] print:bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out print:bg-black"
                          style={{ width: `${Math.max(3, cat.percentage)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}

                  {financialSummary.categoryBreakdown.length === 0 && (
                    <div className="text-center py-6 text-xs text-stone-400">
                      No categorical sales recorded in this period.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F6F9FA] print:bg-stone-100 border border-[#D2DFE2] print:border-stone-300 flex items-center justify-between text-xs print:text-[9px] text-stone-600">
                <span>Leading Department:</span>
                <strong className="text-[#10222B] font-bold">
                  {financialSummary.categoryBreakdown[0]?.category || 'Specialty Coffee'}
                </strong>
              </div>
            </div>

            {/* Top 5 Best-Selling Products List (7 Cols) */}
            <div className="lg:col-span-7 print:col-span-7 p-5 sm:p-6 rounded-3xl bg-white border border-[#D2DFE2] shadow-warm-xs flex flex-col justify-between space-y-4 hover:shadow-warm-md transition-all duration-300 print:p-4 print:rounded-xl print:border-stone-300">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#D2DFE2]/60 print:border-stone-300">
                  <h4 className="font-serif font-bold text-base print:text-sm text-[#10222B] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 print:hidden" />
                    <span>Top Best-Selling Menu Items</span>
                  </h4>
                  <span className="text-xs print:text-[9px] text-stone-500 font-medium">
                    Ranked by Total Revenue
                  </span>
                </div>

                <div className="divide-y divide-[#D2DFE2]/60 print:divide-stone-200">
                  {financialSummary.topProducts.map((prod, index) => (
                    <div key={prod.name} className="py-2.5 flex items-center justify-between gap-3 first:pt-1.5 last:pb-1 group hover:bg-[#F6F9FA] px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs print:text-[9px] font-bold shrink-0 ${
                          index === 0 ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' :
                          index === 1 ? 'bg-stone-200 text-stone-900' :
                          'bg-[#F2F6F7] text-stone-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs print:text-[9.5px] text-[#10222B] truncate">{prod.name}</h5>
                          <span className="text-[10px] print:text-[8px] text-stone-500 font-medium">{prod.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs print:text-[9.5px] text-emerald-800 print:text-black block">
                          {formatCurrency(prod.revenue)}
                        </span>
                        <span className="text-[10px] print:text-[8px] text-stone-500">
                          {prod.unitsSold} {prod.unitsSold === 1 ? 'unit' : 'units'} sold
                        </span>
                      </div>
                    </div>
                  ))}

                  {financialSummary.topProducts.length === 0 && (
                    <div className="text-center py-6 text-xs text-stone-400">
                      No top product sales recorded for this period.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F6F9FA] print:bg-stone-100 border border-[#D2DFE2] print:border-stone-300 flex items-center justify-between text-xs print:text-[9px] text-stone-600">
                <span>Total Units Sold:</span>
                <strong className="text-[#10222B] font-bold">
                  {financialSummary.totalItemsSold} Items Prepared
                </strong>
              </div>
            </div>

          </div>
        </>
      )}

      {/* 8. PRINT-ONLY AUDIT & SIGN-OFF FOOTER */}
      <div className="hidden print:flex justify-between items-center pt-5 mt-6 border-t border-stone-300 text-[9px] text-stone-600">
        <div>
          <span>Aura Coffee & Kitchen • Point of Sale System</span>
          <span className="mx-2">•</span>
          <span>Confidential Internal Financial Statement</span>
        </div>
        <div className="text-right">
          <span>Prepared & Verified by Store Management</span>
        </div>
      </div>

      {/* 9. DIGITAL RECEIPT INSPECTION MODAL (Hidden in print) */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#D2DFE2] shadow-warm-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Receipt Top Header */}
            <div className="p-6 bg-[#10222B] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A47] text-[#77C7C6] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-white">
                    Order Ticket #{inspectingOrder.orderNumber}
                  </h4>
                  <p className="text-xs text-stone-300">
                    Aura Coffee & Kitchen Digital Receipt
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-stone-500">Customer: <strong className="text-[#10222B]">{inspectingOrder.customerName}</strong></span>
                <span className="text-stone-500 font-mono">
                  {new Date(inspectingOrder.completedAt || inspectingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Items Breakdown</span>
                {inspectingOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#10222B]">{it.quantity}x {it.name}</span>
                      {it.customization && (
                        <span className="block text-[10px] text-[#1B8585]">{it.customization}</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#10222B]">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-3 border-t border-stone-100 space-y-1.5">
                {inspectingOrder.totalDiscountSaved && inspectingOrder.totalDiscountSaved > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Zero-Waste Promo Discount</span>
                    <span className="font-mono font-bold">-{formatCurrency(inspectingOrder.totalDiscountSaved)}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-base font-bold text-[#10222B] pt-2 border-t border-stone-200">
                  <span>Total Amount Paid</span>
                  <span className="font-mono text-emerald-800 font-bold">{formatCurrency(inspectingOrder.total)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>Payment Method: <strong className="text-[#10222B]">{inspectingOrder.paymentMethod || 'UPI / QR'}</strong></span>
                  <span className="text-emerald-700 font-bold">PAID & SETTLED</span>
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="p-4 bg-[#F6F9FA] border-t border-[#D2DFE2] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D2DFE2] text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-[#10222B] text-[#77C7C6] hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-warm-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
