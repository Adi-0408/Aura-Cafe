import { RestockOrder, LiveOrder } from '../types';
import { formatCurrency } from './currency';

/**
 * Utility to inject HTML into a hidden iframe and trigger browser native Print / Save to PDF dialog.
 */
function openPrintableFrame(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Trigger print after rendering
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 300);
  }
}

// ==========================================
// 1. STOCK & GOODS RESTOCK ORDERS PDF EXPORTS
// ==========================================

/**
 * Exports a master summary PDF statement of Stock & Goods Purchase Orders.
 */
export const exportRestockOrdersSummaryPDF = (
  orders: RestockOrder[],
  meta?: { title?: string; statusFilter?: string }
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const receivedOrders = orders.filter(o => o.status === 'received');
  const inTransitOrders = orders.filter(o => o.status === 'ordered' || o.status === 'in_transit');
  const totalItemsCount = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantityOrdered, 0), 0);
  const uniqueSuppliers = new Set(orders.map(o => o.supplierName)).size;

  const rowsHtml = orders.map((o) => {
    const isReceived = o.status === 'received';
    const isCancelled = o.status === 'cancelled';
    const isOrdered = o.status === 'ordered' || o.status === 'in_transit';

    const statusBg = isReceived ? '#dcfce7' : isCancelled ? '#ffe4e6' : '#fef3c7';
    const statusColor = isReceived ? '#166534' : isCancelled ? '#9f1239' : '#92400e';
    const statusLabel = isReceived ? 'Delivered & Received' : isCancelled ? 'Cancelled' : 'Ordered / In Transit';

    const itemsStr = o.items.map(i => {
      const deliveredText = isReceived && i.quantityReceived !== undefined ? ` (Rec: ${i.quantityReceived} ${i.unit})` : '';
      return `<strong>${i.quantityOrdered} ${i.unit}</strong> ${i.itemName}${deliveredText}`;
    }).join('<br/>');

    const orderDate = new Date(o.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const receivedDate = o.receivedAt ? new Date(o.receivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #10222B;">
          ${o.orderNumber}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #10222B; font-size: 12px;">${o.supplierName}</strong>
          ${o.supplierPhone ? `<div style="font-size: 10px; color: #64748b;">${o.supplierPhone}</div>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 11px;">
          ${orderDate}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
          ${itemsStr}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #475569;">
          ${o.deliveryInvoiceNo || '—'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold; color: #10222B;">
          ${formatCurrency(o.totalAmount)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase; white-space: nowrap;">
            ${statusLabel}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${meta?.title || 'Aura Coffee - Stock & Goods Purchase Orders Report'}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #10222B;
            background: #ffffff;
            margin: 0;
            padding: 16px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #10222B;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-family: "Georgia", serif;
            font-size: 22px;
            font-weight: bold;
            color: #10222B;
            margin: 0 0 4px 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          .report-badge {
            text-align: right;
          }
          .report-tag {
            background: #10222B;
            color: #77C7C6;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 4px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .kpi-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-family: "Georgia", serif;
            font-size: 18px;
            font-weight: bold;
            color: #10222B;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background: #10222B;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">AURA COFFEE & KITCHEN</h1>
            <p class="brand-sub">Stock & Goods Procurement Suite • 14/2 Elmwood Boulevard, Bandra West, Mumbai • GSTIN: 27AABCA1234F1Z8</p>
          </div>
          <div class="report-badge">
            <span class="report-tag">GOODS & PURCHASE ORDERS STATEMENT</span>
            <div style="font-size: 10px; color: #64748b;">Generated: ${dateStr} ${timeStr}</div>
            ${meta?.statusFilter ? `<div style="font-size: 10px; font-weight: bold; color: #1B8585;">Filter: ${meta.statusFilter}</div>` : ''}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Purchase Order Spend</div>
            <div class="kpi-value" style="color: #10222B;">${formatCurrency(totalValue)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Purchase Orders</div>
            <div class="kpi-value">${orders.length} <span style="font-size: 11px; font-weight: normal; color: #64748b;">(${uniqueSuppliers} Suppliers)</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Delivered & Stocked</div>
            <div class="kpi-value" style="color: #166534;">${receivedOrders.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">In-Transit / Ordered</div>
            <div class="kpi-value" style="color: #92400e;">${inTransitOrders.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 80px;">PO #</th>
              <th style="width: 150px;">Supplier</th>
              <th style="width: 90px;">Ordered Date</th>
              <th>Goods & Restock Items</th>
              <th style="width: 100px;">Invoice / Challan</th>
              <th style="width: 100px; text-align: right;">Total Amount</th>
              <th style="width: 130px; text-align: center;">Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8;">No restock purchase orders recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Aura Inventory & Supply Chain Management Suite • Official Record</span>
          <span>Page 1 of 1 • System Verified Document</span>
        </div>
      </body>
    </html>
  `;

  openPrintableFrame(htmlContent);
};

/**
 * Exports an official single Purchase Order / Goods Received Note (GRN) PDF.
 */
export const exportSingleRestockOrderPDF = (order: RestockOrder) => {
  const isReceived = order.status === 'received';
  const isCancelled = order.status === 'cancelled';
  const orderDate = new Date(order.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const receivedDate = order.receivedAt ? new Date(order.receivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending Delivery';

  const itemsHtml = order.items.map((item, idx) => {
    const deliveredQty = isReceived && item.quantityReceived !== undefined ? item.quantityReceived : item.quantityOrdered;
    const isMatching = deliveredQty === item.quantityOrdered;

    return `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #10222B;">${item.itemName}</strong>
          ${item.sku ? `<div style="font-size: 10px; color: #64748b;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold;">
          ${item.quantityOrdered} ${item.unit}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold; color: ${isReceived ? (isMatching ? '#166534' : '#92400e') : '#64748b'};">
          ${isReceived ? `${deliveredQty} ${item.unit}` : 'Pending Arrival'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">
          ${formatCurrency(item.unitCost)} / ${item.unit}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-weight: bold; color: #10222B;">
          ${formatCurrency(item.totalCost || (item.quantityOrdered * item.unitCost))}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order ${order.orderNumber} - Aura Coffee</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #10222B;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
          }
          .po-card {
            max-width: 680px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }
          .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #10222B;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-name {
            font-family: "Georgia", serif;
            font-size: 24px;
            font-weight: bold;
            color: #10222B;
            margin: 0 0 4px 0;
          }
          .brand-meta {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }
          .po-title {
            text-align: right;
          }
          .po-pill {
            background: #10222B;
            color: #77C7C6;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
          }
          .info-block div:first-child {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
          }
          .info-block div:last-child {
            font-size: 13px;
            font-weight: bold;
            color: #10222B;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .total-box {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stamp-box {
            margin-top: 20px;
            padding: 12px;
            border-radius: 12px;
            background: ${isReceived ? '#f0fdf4' : '#fffbeb'};
            border: 1px solid ${isReceived ? '#bbf7d0' : '#fde68a'};
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .stamp-text {
            color: ${isReceived ? '#166534' : '#92400e'};
            font-weight: bold;
            font-size: 12px;
          }
          .photo-box {
            margin-top: 16px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .photo-box img {
            max-height: 180px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            margin-top: 6px;
            display: block;
          }
          .footer-note {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="po-card">
          
          <div class="brand-header">
            <div>
              <h1 class="brand-name">AURA COFFEE & KITCHEN</h1>
              <div class="brand-meta">
                Delivery & Receiving Location: 14/2 Elmwood Boulevard, Bandra West, Mumbai 400050<br/>
                Phone: +91 98200 44321 • GSTIN: 27AABCA1234F1Z8
              </div>
            </div>
            <div class="po-title">
              <span class="po-pill">PURCHASE ORDER & GOODS RECEIPT</span>
              <div style="font-size: 14px; font-family: monospace; font-weight: bold; margin-top: 4px; color: #10222B;">
                ${order.orderNumber}
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <div>Supplier & Vendor</div>
              <div>${order.supplierName}</div>
              ${order.supplierPhone ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">Tel: ${order.supplierPhone}</div>` : ''}
              ${order.supplierEmail ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">Email: ${order.supplierEmail}</div>` : ''}
            </div>
            <div class="info-block">
              <div>PO Date & Delivery Details</div>
              <div>Ordered: ${orderDate}</div>
              <div style="font-size: 11px; color: #64748b; font-weight: normal;">Expected: ${order.expectedDeliveryDate || 'Standard 48hr'}</div>
              ${order.deliveryInvoiceNo ? `<div style="font-size: 11px; color: #10222B; font-weight: bold; margin-top: 2px;">Invoice/Challan: ${order.deliveryInvoiceNo}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Stock / Goods Item Description</th>
                <th style="width: 80px; text-align: center;">PO Qty</th>
                <th style="width: 90px; text-align: center;">Delivered</th>
                <th style="width: 90px; text-align: right;">Unit Rate</th>
                <th style="width: 100px; text-align: right;">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <span style="font-size: 11px; color: #64748b;">Ordered By: <strong>${order.orderedBy}</strong></span>
              ${order.receivedBy ? `<span style="font-size: 11px; color: #64748b; margin-left: 14px;">Received By: <strong>${order.receivedBy}</strong></span>` : ''}
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block;">Total PO Value</span>
              <span style="font-size: 18px; font-family: monospace; font-weight: bold; color: #10222B;">${formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          ${order.deliveryReceiptImageUrl ? `
            <div class="photo-box">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Attached Live Goods / Invoice Photo:</div>
              <img src="${order.deliveryReceiptImageUrl}" alt="Goods Delivery Photo" />
            </div>
          ` : ''}

          ${order.notes ? `
            <div style="margin-top: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: #475569;">
              <strong>Inspection & Delivery Notes:</strong> ${order.notes}
            </div>
          ` : ''}

          <div class="stamp-box">
            <span class="stamp-text">
              ${isReceived ? `✓ GOODS RECEIVED & VERIFIED INTO INVENTORY (${receivedDate})` : '⏳ PO ISSUED — AWAITING PHYSICAL DELIVERY ARRIVAL'}
            </span>
            <span style="font-size: 10px; font-family: monospace; color: #64748b;">
              PO REF: ${order.orderNumber}
            </span>
          </div>

          <div class="footer-note">
            Aura Coffee & Kitchen Operations & Supply Chain • Inventory Integrity Guaranteed
          </div>

        </div>
      </body>
    </html>
  `;

  openPrintableFrame(htmlContent);
};

// ==========================================
// 2. CUSTOMER ORDERS PDF EXPORTS (PRESERVED)
// ==========================================

export const exportOrdersSummaryPDF = (
  orders: LiveOrder[],
  meta?: { title?: string; dateRangeLabel?: string }
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCogs = completedOrders.reduce((sum, o) => sum + (o.totalCostBasis || (o.total * 0.28)), 0);
  const netProfit = Math.max(0, totalRevenue - totalCogs);
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const aov = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const rowsHtml = orders.map((o) => {
    const isCompleted = o.status === 'completed';
    const isReady = o.status === 'ready';
    const isCancelled = o.status === 'cancelled';
    const statusBg = isCompleted ? '#dcfce7' : isReady ? '#e0f2fe' : isCancelled ? '#ffe4e6' : '#fef3c7';
    const statusColor = isCompleted ? '#166534' : isReady ? '#075985' : isCancelled ? '#9f1239' : '#92400e';
    const statusLabel = isCompleted ? 'Paid & Completed' : isReady ? 'Ready for Pickup' : isCancelled ? 'Cancelled' : 'Preparing';
    const itemsStr = o.items.map(i => `<strong>${i.quantity}x</strong> ${i.name}${i.customization ? ` <em>(${i.customization})</em>` : ''}`).join('<br/>');
    const orderDate = new Date(o.completedAt || o.createdAt).toLocaleString('en-IN', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
    const totalQty = o.items.reduce((s, i) => s + i.quantity, 0);

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #10222B;">#${o.orderNumber}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #10222B;">${o.customerName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${orderDate}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">${itemsStr}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${totalQty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold; color: #10222B;">${formatCurrency(o.total)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
            ${statusLabel}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${meta?.title || 'Aura Coffee - Orders & Sales Report'}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #10222B;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #10222B;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand-title {
            font-family: "Georgia", serif;
            font-size: 22px;
            font-weight: bold;
            color: #10222B;
            margin: 0 0 4px 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          .report-badge {
            text-align: right;
          }
          .report-tag {
            background: #10222B;
            color: #77C7C6;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 4px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .kpi-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-family: "Georgia", serif;
            font-size: 18px;
            font-weight: bold;
            color: #10222B;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background: #10222B;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
          }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">AURA COFFEE & KITCHEN</h1>
            <p class="brand-sub">14/2 Elmwood Boulevard, Bandra West, Mumbai • GSTIN: 27AABCA1234F1Z8 • +91 98200 44321</p>
          </div>
          <div class="report-badge">
            <span class="report-tag">MASTER ORDERS & SALES REPORT</span>
            <div style="font-size: 10px; color: #64748b;">Generated: ${dateStr} ${timeStr}</div>
            ${meta?.dateRangeLabel ? `<div style="font-size: 10px; font-weight: bold; color: #1B8585;">Scope: ${meta.dateRangeLabel}</div>` : ''}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Gross Revenue</div>
            <div class="kpi-value" style="color: #166534;">${formatCurrency(totalRevenue)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Completed Orders</div>
            <div class="kpi-value">${completedOrders.length} <span style="font-size: 11px; font-weight: normal; color: #64748b;">(${orders.length} total)</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Avg Order Value (AOV)</div>
            <div class="kpi-value">${formatCurrency(aov)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Est. Net Profit</div>
            <div class="kpi-value">${formatCurrency(netProfit)} <span style="font-size: 10px; color: #1B8585;">(${profitMargin}%)</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 70px;">Order #</th>
              <th style="width: 130px;">Customer</th>
              <th style="width: 110px;">Date & Time</th>
              <th>Items & Customizations</th>
              <th style="width: 40px; text-align: center;">Qty</th>
              <th style="width: 90px; text-align: right;">Total</th>
              <th style="width: 110px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8;">No orders recorded in this period.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Aura Operations Intelligence Suite • Confidential & Proprietary</span>
          <span>Page 1 of 1 • System Verified Record</span>
        </div>
      </body>
    </html>
  `;

  openPrintableFrame(htmlContent);
};

export const exportSingleOrderInvoicePDF = (order: LiveOrder) => {
  const dateObj = new Date(order.completedAt || order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  const subtotal = order.total;
  const estimatedTax = Number((subtotal * 0.05).toFixed(2));
  const isCompleted = order.status === 'completed';

  const itemsHtml = order.items.map((i, idx) => `
    <tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${idx + 1}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">
        <strong style="color: #10222B;">${i.name}</strong>
        ${i.customization ? `<div style="font-size: 10px; color: #64748b;">Customization: ${i.customization}</div>` : ''}
      </td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold;">${i.quantity}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace;">${formatCurrency(i.price)}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-weight: bold; color: #10222B;">${formatCurrency(i.price * i.quantity)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - Order #${order.orderNumber} - Aura Coffee</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #10222B;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 12px;
          }
          .invoice-card {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }
          .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #10222B;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-name {
            font-family: "Georgia", serif;
            font-size: 24px;
            font-weight: bold;
            color: #10222B;
            margin: 0 0 4px 0;
          }
          .brand-meta {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }
          .invoice-title {
            text-align: right;
          }
          .tax-pill {
            background: #10222B;
            color: #77C7C6;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
          }
          .info-block div:first-child {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
          }
          .info-block div:last-child {
            font-size: 13px;
            font-weight: bold;
            color: #10222B;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .summary-box {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            width: 240px;
            font-size: 12px;
            color: #475569;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            width: 240px;
            font-size: 16px;
            font-weight: bold;
            color: #10222B;
            padding-top: 6px;
            border-top: 2px solid #10222B;
          }
          .stamp-box {
            margin-top: 24px;
            padding: 12px;
            border-radius: 12px;
            background: ${isCompleted ? '#f0fdf4' : '#fffbeb'};
            border: 1px solid ${isCompleted ? '#bbf7d0' : '#fde68a'};
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .stamp-text {
            color: ${isCompleted ? '#166534' : '#92400e'};
            font-weight: bold;
            font-size: 12px;
          }
          .footer-note {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          
          <div class="brand-header">
            <div>
              <h1 class="brand-name">AURA COFFEE & KITCHEN</h1>
              <div class="brand-meta">
                14/2 Elmwood Boulevard, Bandra West, Mumbai 400050<br/>
                Phone: +91 98200 44321 • GSTIN: 27AABCA1234F1Z8<br/>
                FSSAI Lic No: 11521019000412
              </div>
            </div>
            <div class="invoice-title">
              <span class="tax-pill">TAX INVOICE / RECEIPT</span>
              <div style="font-size: 14px; font-family: monospace; font-weight: bold; margin-top: 4px; color: #10222B;">
                #INV-${order.orderNumber}
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <div>Billed To (Customer)</div>
              <div>${order.customerName}</div>
            </div>
            <div class="info-block">
              <div>Date & Time</div>
              <div>${dateStr} • ${timeStr}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Item & Description</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 80px; text-align: right;">Rate</th>
                <th style="width: 90px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>Item Subtotal:</span>
              <span style="font-family: monospace;">${formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>GST / Taxes (Included):</span>
              <span style="font-family: monospace;">${formatCurrency(estimatedTax)}</span>
            </div>
            <div class="total-row">
              <span>Total Payable:</span>
              <span style="font-family: monospace; color: #1B8585;">${formatCurrency(order.total)}</span>
            </div>
          </div>

          <div class="stamp-box">
            <span class="stamp-text">
              ${isCompleted ? '✓ PAYMENT STATUS: PAID IN FULL' : '⏳ PAYMENT STATUS: PENDING / ORDER IN PREPARATION'}
            </span>
            <span style="font-size: 10px; font-family: monospace; color: #64748b;">
              AUTH: AURA-POS-${order.orderNumber}
            </span>
          </div>

          <div class="footer-note">
            Thank you for dining with Aura Coffee & Kitchen! We craft organic artisan coffee & fresh bakery daily.
          </div>

        </div>
      </body>
    </html>
  `;

  openPrintableFrame(htmlContent);
};
