import * as XLSX from 'xlsx';
import { LiveOrder } from '../types';

export type LedgerPeriodType = 'day' | 'week' | 'month' | 'year' | 'all';

export interface TimeDistributionBucket {
  key: string;
  label: string;
  shortLabel: string;
  dateStr: string;
  grossRevenue: number;
  netProfit: number;
  cogs: number;
  ordersCount: number;
  itemsCount: number;
}

export interface CategorySalesSummary {
  category: string;
  revenue: number;
  percentage: number;
  itemsSold: number;
  color: string;
}

export interface TopProductSales {
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
}

export interface PeriodFinancialSummary {
  periodType: LedgerPeriodType;
  periodLabel: string;
  dateRange: { start: Date; end: Date };
  totalGrossRevenue: number;
  totalCogs: number;
  totalNetProfit: number;
  profitMarginPercent: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  totalItemsSold: number;
  averageOrderValue: number;
  discountSavingsGiven: number;
  distributionBuckets: TimeDistributionBucket[];
  categoryBreakdown: CategorySalesSummary[];
  topProducts: TopProductSales[];
  filteredOrders: LiveOrder[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Specialty Coffee': '#1B8585',
  'Teas & Wellness': '#3BAFA9',
  'Bakery & Pastry': '#D97706',
  'Brunch & Food': '#E11D48',
  'Retail Coffee Beans': '#78350F',
  'Packaging': '#64748B',
  'Default': '#10222B'
};

const getCategoryColor = (cat: string): string => {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return CATEGORY_COLORS['Default'];
};

// Date Boundaries Helpers
export const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sun, 1 is Mon
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
};

export const getEndOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

export const shiftPeriodDate = (currentDate: Date, periodType: LedgerPeriodType, delta: number): Date => {
  const d = new Date(currentDate);
  if (periodType === 'day') {
    d.setDate(d.getDate() + delta);
  } else if (periodType === 'week') {
    d.setDate(d.getDate() + delta * 7);
  } else if (periodType === 'month') {
    d.setMonth(d.getMonth() + delta);
  } else if (periodType === 'year') {
    d.setFullYear(d.getFullYear() + delta);
  }
  return d;
};

export const formatPeriodLabel = (periodType: LedgerPeriodType, date: Date): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (periodType === 'day') {
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  } else if (periodType === 'week') {
    const start = getStartOfWeek(date);
    const end = getEndOfWeek(date);
    return `${start.getDate()} ${monthNames[start.getMonth()].substring(0, 3)} – ${end.getDate()} ${monthNames[end.getMonth()].substring(0, 3)} ${end.getFullYear()}`;
  } else if (periodType === 'month') {
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  } else if (periodType === 'year') {
    return `Calendar Year ${date.getFullYear()}`;
  }
  return 'All Time Lifetime Ledger';
};

export const calculatePeriodFinancials = (
  orders: LiveOrder[],
  periodType: LedgerPeriodType,
  referenceDate: Date = new Date()
): PeriodFinancialSummary => {
  let startDate: Date;
  let endDate: Date;

  if (periodType === 'day') {
    startDate = getStartOfDay(referenceDate);
    endDate = getEndOfDay(referenceDate);
  } else if (periodType === 'week') {
    startDate = getStartOfWeek(referenceDate);
    endDate = getEndOfWeek(referenceDate);
  } else if (periodType === 'month') {
    startDate = getStartOfMonth(referenceDate);
    endDate = getEndOfMonth(referenceDate);
  } else if (periodType === 'year') {
    startDate = getStartOfYear(referenceDate);
    endDate = getEndOfYear(referenceDate);
  } else {
    // All time
    startDate = new Date(2020, 0, 1);
    endDate = new Date(2030, 11, 31);
  }

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  // Filter orders in this range
  const filteredOrders = orders.filter(o => {
    const t = o.completedAt || o.createdAt;
    return t >= startTime && t <= endTime;
  }).sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));

  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCogs = completedOrders.reduce((sum, o) => {
    if (o.totalCostBasis) return sum + o.totalCostBasis;
    return sum + (o.total * 0.28);
  }, 0);

  const totalNetProfit = Math.max(0, totalGrossRevenue - totalCogs);
  const profitMarginPercent = totalGrossRevenue > 0
    ? Number(((totalNetProfit / totalGrossRevenue) * 100).toFixed(1))
    : 0;

  const totalItemsSold = completedOrders.reduce((sum, o) => {
    return sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0);
  }, 0);

  const averageOrderValue = completedOrders.length > 0
    ? Number((totalGrossRevenue / completedOrders.length).toFixed(2))
    : 0;

  const discountSavingsGiven = completedOrders.reduce((sum, o) => sum + (o.totalDiscountSaved || 0), 0);

  // --- TIME DISTRIBUTION BUCKETS ---
  const distributionBuckets: TimeDistributionBucket[] = [];

  if (periodType === 'day') {
    // Hourly distribution: 7 AM to 10 PM (16 hours)
    const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    hours.forEach(hour => {
      const hStart = new Date(referenceDate);
      hStart.setHours(hour, 0, 0, 0);
      const hEnd = new Date(referenceDate);
      hEnd.setHours(hour, 59, 59, 999);

      const hourOrders = completedOrders.filter(o => {
        const t = o.completedAt || o.createdAt;
        return t >= hStart.getTime() && t <= hEnd.getTime();
      });

      const rev = hourOrders.reduce((acc, o) => acc + o.total, 0);
      const cogs = hourOrders.reduce((acc, o) => acc + (o.totalCostBasis || o.total * 0.28), 0);
      const items = hourOrders.reduce((acc, o) => acc + o.items.reduce((iAcc, it) => iAcc + it.quantity, 0), 0);

      const hourFormatted = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      distributionBuckets.push({
        key: `hour-${hour}`,
        label: hourFormatted,
        shortLabel: hourFormatted,
        dateStr: `${hourFormatted}`,
        grossRevenue: rev,
        netProfit: Math.max(0, rev - cogs),
        cogs,
        ordersCount: hourOrders.length,
        itemsCount: items
      });
    });
  } else if (periodType === 'week') {
    // 7 days: Monday through Sunday
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfWeek = getStartOfWeek(referenceDate);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStart = getStartOfDay(d).getTime();
      const dEnd = getEndOfDay(d).getTime();

      const dayOrders = completedOrders.filter(o => {
        const t = o.completedAt || o.createdAt;
        return t >= dStart && t <= dEnd;
      });

      const rev = dayOrders.reduce((acc, o) => acc + o.total, 0);
      const cogs = dayOrders.reduce((acc, o) => acc + (o.totalCostBasis || o.total * 0.28), 0);
      const items = dayOrders.reduce((acc, o) => acc + o.items.reduce((iAcc, it) => iAcc + it.quantity, 0), 0);

      distributionBuckets.push({
        key: `day-${i}`,
        label: `${dayLabels[i]} (${d.getDate()})`,
        shortLabel: dayLabels[i],
        dateStr: `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        grossRevenue: rev,
        netProfit: Math.max(0, rev - cogs),
        cogs,
        ordersCount: dayOrders.length,
        itemsCount: items
      });
    }
  } else if (periodType === 'month') {
    // 4 to 5 Weeks distribution
    const startMonth = getStartOfMonth(referenceDate);
    const endMonth = getEndOfMonth(referenceDate);
    const totalDays = endMonth.getDate();

    const weeks = [
      { label: 'Week 1 (1-7)', startDay: 1, endDay: 7 },
      { label: 'Week 2 (8-14)', startDay: 8, endDay: 14 },
      { label: 'Week 3 (15-21)', startDay: 15, endDay: 21 },
      { label: 'Week 4 (22-28)', startDay: 22, endDay: 28 },
      { label: `Week 5 (29-${totalDays})`, startDay: 29, endDay: totalDays }
    ];

    weeks.forEach((w, idx) => {
      if (w.startDay > totalDays) return;
      const actualEnd = Math.min(w.endDay, totalDays);
      const wStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), w.startDay, 0, 0, 0, 0).getTime();
      const wEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), actualEnd, 23, 59, 59, 999).getTime();

      const weekOrders = completedOrders.filter(o => {
        const t = o.completedAt || o.createdAt;
        return t >= wStart && t <= wEnd;
      });

      const rev = weekOrders.reduce((acc, o) => acc + o.total, 0);
      const cogs = weekOrders.reduce((acc, o) => acc + (o.totalCostBasis || o.total * 0.28), 0);
      const items = weekOrders.reduce((acc, o) => acc + o.items.reduce((iAcc, it) => iAcc + it.quantity, 0), 0);

      distributionBuckets.push({
        key: `week-${idx + 1}`,
        label: w.label,
        shortLabel: `Wk ${idx + 1}`,
        dateStr: `${w.startDay} - ${actualEnd} ${referenceDate.toLocaleString('default', { month: 'short' })}`,
        grossRevenue: rev,
        netProfit: Math.max(0, rev - cogs),
        cogs,
        ordersCount: weekOrders.length,
        itemsCount: items
      });
    });
  } else if (periodType === 'year') {
    // 12 Months: Jan - Dec
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetYear = referenceDate.getFullYear();

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(targetYear, m, 1, 0, 0, 0, 0).getTime();
      const mEnd = new Date(targetYear, m + 1, 0, 23, 59, 59, 999).getTime();

      const monthOrders = completedOrders.filter(o => {
        const t = o.completedAt || o.createdAt;
        return t >= mStart && t <= mEnd;
      });

      const rev = monthOrders.reduce((acc, o) => acc + o.total, 0);
      const cogs = monthOrders.reduce((acc, o) => acc + (o.totalCostBasis || o.total * 0.28), 0);
      const items = monthOrders.reduce((acc, o) => acc + o.items.reduce((iAcc, it) => iAcc + it.quantity, 0), 0);

      distributionBuckets.push({
        key: `month-${m}`,
        label: monthNamesShort[m],
        shortLabel: monthNamesShort[m],
        dateStr: `${monthNamesShort[m]} ${targetYear}`,
        grossRevenue: rev,
        netProfit: Math.max(0, rev - cogs),
        cogs,
        ordersCount: monthOrders.length,
        itemsCount: items
      });
    }
  } else {
    // All time -> Group by years
    const years = [2024, 2025, 2026];
    years.forEach(yr => {
      const yStart = new Date(yr, 0, 1, 0, 0, 0, 0).getTime();
      const yEnd = new Date(yr, 11, 31, 23, 59, 59, 999).getTime();

      const yrOrders = completedOrders.filter(o => {
        const t = o.completedAt || o.createdAt;
        return t >= yStart && t <= yEnd;
      });

      const rev = yrOrders.reduce((acc, o) => acc + o.total, 0);
      const cogs = yrOrders.reduce((acc, o) => acc + (o.totalCostBasis || o.total * 0.28), 0);
      const items = yrOrders.reduce((acc, o) => acc + o.items.reduce((iAcc, it) => iAcc + it.quantity, 0), 0);

      distributionBuckets.push({
        key: `year-${yr}`,
        label: String(yr),
        shortLabel: String(yr),
        dateStr: `Year ${yr}`,
        grossRevenue: rev,
        netProfit: Math.max(0, rev - cogs),
        cogs,
        ordersCount: yrOrders.length,
        itemsCount: items
      });
    });
  }

  // --- CATEGORY BREAKDOWN ---
  const catMap: Record<string, { revenue: number; itemsSold: number }> = {};
  const prodMap: Record<string, { name: string; category: string; unitsSold: number; revenue: number; profit: number }> = {};

  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const cat = item.category || (item.name.toLowerCase().includes('croissant') || item.name.toLowerCase().includes('cake') || item.name.toLowerCase().includes('pastry') ? 'Bakery & Pastry' : item.name.toLowerCase().includes('toast') || item.name.toLowerCase().includes('tartine') || item.name.toLowerCase().includes('french') ? 'Brunch & Food' : item.name.toLowerCase().includes('matcha') || item.name.toLowerCase().includes('tea') ? 'Teas & Wellness' : item.name.toLowerCase().includes('bean') ? 'Retail Coffee Beans' : 'Specialty Coffee');
      
      if (!catMap[cat]) catMap[cat] = { revenue: 0, itemsSold: 0 };
      const itemRev = item.price * item.quantity;
      catMap[cat].revenue += itemRev;
      catMap[cat].itemsSold += item.quantity;

      if (!prodMap[item.name]) {
        prodMap[item.name] = {
          name: item.name,
          category: cat,
          unitsSold: 0,
          revenue: 0,
          profit: 0
        };
      }
      prodMap[item.name].unitsSold += item.quantity;
      prodMap[item.name].revenue += itemRev;
      prodMap[item.name].profit += itemRev * 0.72; // ~72% profit margin
    });
  });

  const categoryBreakdown: CategorySalesSummary[] = Object.entries(catMap).map(([category, data]) => ({
    category,
    revenue: data.revenue,
    percentage: totalGrossRevenue > 0 ? Number(((data.revenue / totalGrossRevenue) * 100).toFixed(1)) : 0,
    itemsSold: data.itemsSold,
    color: getCategoryColor(category)
  })).sort((a, b) => b.revenue - a.revenue);

  const topProducts: TopProductSales[] = Object.values(prodMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    periodType,
    periodLabel: formatPeriodLabel(periodType, referenceDate),
    dateRange: { start: startDate, end: endDate },
    totalGrossRevenue,
    totalCogs,
    totalNetProfit,
    profitMarginPercent,
    totalOrdersCount: filteredOrders.length,
    completedOrdersCount: completedOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    totalItemsSold,
    averageOrderValue,
    discountSavingsGiven,
    distributionBuckets,
    categoryBreakdown,
    topProducts,
    filteredOrders
  };
};

export const exportSalesLedgerToExcel = (
  summary: PeriodFinancialSummary,
  orders: LiveOrder[]
) => {
  const summaryRows = [
    { 'Key Metric': 'Report Title', 'Value': `Aura Cafe - Sales Ledger Performance Statement (${summary.periodLabel})` },
    { 'Key Metric': 'Generated Date', 'Value': new Date().toLocaleString() },
    { 'Key Metric': 'Total Gross Revenue (₹)', 'Value': summary.totalGrossRevenue },
    { 'Key Metric': 'Total COGS / Ingredient Cost (₹)', 'Value': summary.totalCogs },
    { 'Key Metric': 'Total Net Profit (₹)', 'Value': summary.totalNetProfit },
    { 'Key Metric': 'Profit Margin (%)', 'Value': `${summary.profitMarginPercent}%` },
    { 'Key Metric': 'Total Completed Orders', 'Value': summary.completedOrdersCount },
    { 'Key Metric': 'Total Items Prepared & Sold', 'Value': summary.totalItemsSold },
    { 'Key Metric': 'Average Order Value (₹)', 'Value': summary.averageOrderValue },
    { 'Key Metric': 'Zero-Waste Discount Given (₹)', 'Value': summary.discountSavingsGiven }
  ];

  const transactionRows = orders.map(o => {
    const itemsFormatted = o.items.map(it => `${it.quantity}x ${it.name}${it.customization ? ` (${it.customization})` : ''}`).join(', ');
    const dateFormatted = new Date(o.completedAt || o.createdAt).toLocaleString();
    const cogs = o.totalCostBasis || Number((o.total * 0.28).toFixed(2));
    const profit = Math.max(0, o.total - cogs);

    return {
      'Ticket #': `#${o.orderNumber}`,
      'Date & Time': dateFormatted,
      'Customer': o.customerName,
      'Items Ordered': itemsFormatted,
      'Payment Method': o.paymentMethod || 'UPI / QR',
      'Total Amount (₹)': o.total,
      'Cost Basis / COGS (₹)': cogs,
      'Net Profit (₹)': profit,
      'Status': o.status.toUpperCase(),
      'Discount Applied (₹)': o.totalDiscountSaved || 0
    };
  });

  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Transactions
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  wsTransactions['!cols'] = [
    { wch: 12 }, // Ticket #
    { wch: 22 }, // Date & Time
    { wch: 20 }, // Customer
    { wch: 45 }, // Items Ordered
    { wch: 16 }, // Payment Method
    { wch: 16 }, // Total Amount
    { wch: 20 }, // Cost Basis
    { wch: 16 }, // Net Profit
    { wch: 14 }, // Status
    { wch: 20 }  // Discount
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Sales Transactions');

  // Sheet 2: Executive Summary
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 3: Time Distribution
  const distributionRows = summary.distributionBuckets.map(b => ({
    'Period Interval': b.label,
    'Date / Time': b.dateStr,
    'Gross Revenue (₹)': b.grossRevenue,
    'COGS (₹)': b.cogs,
    'Net Profit (₹)': b.netProfit,
    'Orders Count': b.ordersCount,
    'Items Sold': b.itemsCount
  }));
  const wsDist = XLSX.utils.json_to_sheet(distributionRows);
  wsDist['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsDist, 'Period Distribution');

  const filename = `Aura_Cafe_Sales_Ledger_${summary.periodType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportSalesLedgerToCSV = (
  summary: PeriodFinancialSummary,
  orders: LiveOrder[]
) => {
  const transactionRows = orders.map(o => {
    const itemsFormatted = o.items.map(it => `${it.quantity}x ${it.name}${it.customization ? ` (${it.customization})` : ''}`).join('; ');
    const dateFormatted = new Date(o.completedAt || o.createdAt).toLocaleString();
    const cogs = o.totalCostBasis || Number((o.total * 0.28).toFixed(2));
    const profit = Math.max(0, o.total - cogs);

    return [
      `"#${o.orderNumber}"`,
      `"${dateFormatted}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${itemsFormatted.replace(/"/g, '""')}"`,
      `"${o.paymentMethod || 'UPI / QR'}"`,
      o.total.toFixed(2),
      cogs.toFixed(2),
      profit.toFixed(2),
      `"${o.status.toUpperCase()}"`,
      (o.totalDiscountSaved || 0).toFixed(2)
    ].join(',');
  });

  const headers = [
    'Ticket Number',
    'Date and Time',
    'Customer Name',
    'Items Ordered',
    'Payment Method',
    'Gross Revenue (INR)',
    'COGS Cost Basis (INR)',
    'Net Profit (INR)',
    'Status',
    'Zero-Waste Discount (INR)'
  ];

  const summaryHeader = [
    [`"AURA CAFE - SALES LEDGER STATEMENT (${summary.periodLabel})"`],
    [`"Generated: ${new Date().toLocaleString()}"`],
    [`"Gross Revenue: Rs. ${summary.totalGrossRevenue.toFixed(2)}"`],
    [`"Net Profit: Rs. ${summary.totalNetProfit.toFixed(2)} (${summary.profitMarginPercent}%)"`],
    [`"Completed Orders: ${summary.completedOrdersCount}"`],
    [`"Total Items Sold: ${summary.totalItemsSold}"`],
    [`"Average Order Value: Rs. ${summary.averageOrderValue.toFixed(2)}"`],
    ['--------------------------------------------------'],
    []
  ];

  const csvContent = [
    ...summaryHeader.map(r => r.join(',')),
    headers.join(','),
    ...transactionRows
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aura_Cafe_Sales_Ledger_${summary.periodType}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
