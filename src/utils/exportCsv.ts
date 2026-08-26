import { InventoryItem, Reservation, LiveOrder, RestockOrder } from '../types';

export const exportRestockOrdersToCSV = (orders: RestockOrder[], filename = 'aura-cafe-stock-purchase-orders.csv') => {
  const summaryBlock = [
    ['AURA COFFEE & KITCHEN - STOCK & GOODS PURCHASE ORDERS STATEMENT'],
    [`Generated: ${new Date().toLocaleString()}`],
    ['--------------------------------------------------'],
    ['Total Purchase Orders', String(orders.length)],
    ['Total Spend Amount', orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)],
    ['Delivered & Received Orders', String(orders.filter(o => o.status === 'received').length)],
    ['Ordered / In-Transit Deliveries', String(orders.filter(o => o.status === 'ordered' || o.status === 'in_transit').length)],
    ['--------------------------------------------------'],
    []
  ];

  const headers = [
    'PO Number',
    'Supplier',
    'Supplier Phone',
    'Supplier Email',
    'Status',
    'Ordered Date',
    'Expected Delivery Date',
    'Received Date',
    'Received By',
    'Delivery Invoice No',
    'Items Ordered & Delivered',
    'Total Amount',
    'Inspection Notes'
  ];

  const rows = orders.map(order => {
    const isReceived = order.status === 'received';
    const statusLabel = isReceived ? 'DELIVERED_RECEIVED' : order.status === 'cancelled' ? 'CANCELLED' : 'ORDERED_IN_TRANSIT';
    const itemsList = order.items.map(i => `${i.quantityOrdered} ${i.unit} ${i.itemName}${isReceived && i.quantityReceived !== undefined ? ` (Rec: ${i.quantityReceived})` : ''}`).join('; ');
    const orderDate = new Date(order.orderedAt).toISOString();
    const receivedDate = order.receivedAt ? new Date(order.receivedAt).toISOString() : '';

    return [
      `"${order.orderNumber}"`,
      `"${order.supplierName.replace(/"/g, '""')}"`,
      `"${order.supplierPhone || ''}"`,
      `"${order.supplierEmail || ''}"`,
      `"${statusLabel}"`,
      `"${orderDate}"`,
      `"${order.expectedDeliveryDate || ''}"`,
      `"${receivedDate}"`,
      `"${order.receivedBy || ''}"`,
      `"${order.deliveryInvoiceNo || ''}"`,
      `"${itemsList.replace(/"/g, '""')}"`,
      order.totalAmount.toFixed(2),
      `"${(order.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvLines = [
    ...summaryBlock.map(r => r.join(',')),
    headers.join(','),
    ...rows
  ];

  const csvContent = csvLines.join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const exportInventoryToCSV = (items: InventoryItem[], filename = 'aura-cafe-inventory.csv') => {
  const headers = [
    'SKU',
    'Name',
    'Category',
    'Unit',
    'Quantity',
    'Min Threshold',
    'Unit Cost ($)',
    'Retail Price ($)',
    'Total Valuation ($)',
    'Supplier',
    'Supplier Phone',
    'Supplier Email',
    'Storage Location',
    'Status',
    'Archived',
    'Last Updated'
  ];

  const rows = items.map(item => {
    const isOutOfStock = item.quantity <= 0;
    const isLowStock = !isOutOfStock && item.quantity <= item.minThreshold;
    const status = isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK';
    const valuation = (item.quantity * item.unitCost).toFixed(2);
    const updated = new Date(item.updatedAt).toISOString();

    return [
      `"${item.sku}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.unit}"`,
      item.quantity,
      item.minThreshold,
      item.unitCost.toFixed(2),
      item.price.toFixed(2),
      valuation,
      `"${item.supplier.replace(/"/g, '""')}"`,
      `"${item.supplierPhone || ''}"`,
      `"${item.supplierEmail || ''}"`,
      `"${item.location.replace(/"/g, '""')}"`,
      status,
      item.isArchived ? 'TRUE' : 'FALSE',
      `"${updated}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const exportReservationsToCSV = (reservations: Reservation[], filename = 'aura-cafe-reservations.csv') => {
  const headers = ['ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Seating', 'Status', 'Special Requests', 'Created At'];

  const rows = reservations.map(res => {
    return [
      `"${res.id}"`,
      `"${res.customerName.replace(/"/g, '""')}"`,
      `"${res.email}"`,
      `"${res.phone}"`,
      `"${res.date}"`,
      `"${res.time}"`,
      res.guests,
      `"${res.seatingPreference}"`,
      `"${res.status}"`,
      `"${(res.specialRequests || '').replace(/"/g, '""')}"`,
      `"${new Date(res.createdAt).toISOString()}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};

export interface DailyProfitExportData {
  orders: LiveOrder[];
  collectedRevenue: number;
  completedItemsCount: number;
  totalCogs: number;
  netProfit: number;
  profitMarginPercent: string;
  averageOrderValue: number;
}

export const exportDailyProfitToCSV = (data: DailyProfitExportData, filename?: string) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const defaultFilename = `Aura_Daily_Profit_Statement_${now.toISOString().split('T')[0]}.csv`;

  const completedOrders = data.orders.filter(o => o.status === 'completed');
  const allNonCancelledOrders = data.orders.filter(o => o.status !== 'cancelled');
  const displayOrders = completedOrders.length > 0 ? completedOrders : allNonCancelledOrders;

  // 1. Executive Financial Summary Section
  const summaryBlock = [
    ['"AURA COFFEE & KITCHEN - DAILY REVENUE & PROFIT STATEMENT"', '""', '""', '""', '""', '""', '""', '""'],
    [`"Report Generated: ${dateStr} ${timeStr}"`, '""', '""', '""', '""', '""', '""', '""'],
    ['""', '""', '""', '""', '""', '""', '""', '""'],
    ['"EXECUTIVE SUMMARY METRIC"', '"VALUE"', '""', '""', '""', '""', '""', '""'],
    ['"Total Gross Revenue (₹)"', `"${data.collectedRevenue.toFixed(2)}"`, '""', '""', '""', '""', '""', '""'],
    ['"Cost of Goods Sold / COGS (₹)"', `"${data.totalCogs.toFixed(2)}"`, '""', '""', '""', '""', '""', '""'],
    ['"Net Operating Profit (₹)"', `"${data.netProfit.toFixed(2)}"`, '""', '""', '""', '""', '""', '""'],
    ['"Overall Profit Margin (%)"', `"${data.profitMarginPercent}%"`, '""', '""', '""', '""', '""', '""'],
    ['"Total Orders Completed"', `"${completedOrders.length}"`, '""', '""', '""', '""', '""', '""'],
    ['"Total Items Sold / Rescued"', `"${data.completedItemsCount}"`, '""', '""', '""', '""', '""', '""'],
    ['"Average Order Value / AOV (₹)"', `"${data.averageOrderValue.toFixed(2)}"`, '""', '""', '""', '""', '""', '""'],
    ['""', '""', '""', '""', '""', '""', '""', '""'],
    ['"--- ITEMIZED REGISTER TRANSACTIONS ---"', '""', '""', '""', '""', '""', '""', '""'],
    ['""', '""', '""', '""', '""', '""', '""', '""']
  ];

  // 2. Table Headers
  const tableHeaders = [
    'Order #',
    'Customer Name',
    'Time Logged',
    'Status',
    'Items Ordered',
    'Items Qty',
    'Gross Revenue (INR)',
    'Est. COGS (INR)',
    'Net Profit (INR)',
    'Margin (%)'
  ];

  // 3. Table Data Rows
  let tableRows: string[][] = [];

  if (displayOrders.length === 0) {
    tableRows = [
      [
        '"#101 (Sample/Pending)"',
        '"Store Counter Register"',
        `"${timeStr}"`,
        '"Active Session"',
        '"Register open for daily POS transactions"',
        '0',
        '0.00',
        '0.00',
        '0.00',
        '0.0%'
      ]
    ];
  } else {
    tableRows = displayOrders.map(o => {
      const cogs = o.totalCostBasis || (o.total * 0.28);
      const profit = Math.max(0, o.total - cogs);
      const margin = o.total > 0 ? ((profit / o.total) * 100).toFixed(1) : '0.0';
      const itemsList = o.items.map(i => `${i.quantity}x ${i.name}${i.customization ? ` [${i.customization}]` : ''}`).join('; ');
      const totalQty = o.items.reduce((sum, it) => sum + it.quantity, 0);
      const orderTime = new Date(o.completedAt || o.createdAt).toLocaleTimeString();
      const statusLabel = o.status === 'completed' ? 'Paid & Completed' : o.status === 'ready' ? 'Ready for Pickup' : 'Preparing';

      return [
        `"#${o.orderNumber}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${orderTime}"`,
        `"${statusLabel}"`,
        `"${itemsList.replace(/"/g, '""')}"`,
        String(totalQty),
        o.total.toFixed(2),
        cogs.toFixed(2),
        profit.toFixed(2),
        `"${margin}%"`
      ];
    });
  }

  // Combine Executive Block + Table Headers + Rows
  const csvLines = [
    ...summaryBlock.map(r => r.join(',')),
    tableHeaders.join(','),
    ...tableRows.map(r => r.join(','))
  ];

  const csvContent = csvLines.join('\r\n');
  downloadBlob(csvContent, filename || defaultFilename, 'text/csv;charset=utf-8;');
};

function downloadBlob(content: string, filename: string, contentType: string) {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays UTF-8 and formatting cleanly
  const blob = new Blob(['\uFEFF' + content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  document.body.appendChild(pom);
  pom.click();
  document.body.removeChild(pom);
  URL.revokeObjectURL(url);
}
