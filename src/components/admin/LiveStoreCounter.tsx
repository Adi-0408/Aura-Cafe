import React, { useState, useEffect, useMemo } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useInventory } from '../../context/InventoryContext';
import { usePromotion } from '../../context/PromotionContext';
import { MenuItem, LiveOrder, StockDeduction, InventoryItem } from '../../types';
import { DailyProfitAnalyticsModal } from './DailyProfitAnalyticsModal';
import { SalesLedgerSection } from './SalesLedgerSection';
import { INITIAL_SAMPLE_SALES_LEDGER } from '../../data/sampleSalesLedger';
import * as firebaseService from '../../services/firebaseService';
import { formatCurrency } from '../../utils/currency';
import { 
  Coffee, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Minus, 
  RotateCcw, 
  ShoppingBag, 
  TrendingDown, 
  DollarSign, 
  XCircle, 
  Power, 
  CreditCard,
  User,
  Undo2,
  Trash2,
  TrendingUp,
  Receipt,
  Sparkles,
  RefreshCw,
  Zap,
  Truck,
  ArrowUpRight,
  BarChart3,
  Layers
} from 'lucide-react';

const MILK_OPTIONS = ['Oat Milk (Califia)', 'Whole Milk', 'Almond Milk', 'None / Black'];

export const LiveStoreCounter: React.FC = () => {
  const { menuItems } = useMenu();
  const { inventory, updateStockQuantity, isSyncing } = useInventory();
  const { isHappyHourActive, calculateDiscount, trackPurchaseSavings } = usePromotion();

  // View state: 'pos' (POS Register & Kitchen Queue) | 'ledger' (Overall Sales Ledger & Performance)
  const [counterView, setCounterView] = useState<'pos' | 'ledger'>('pos');
  const [firestoreLedgerOrders, setFirestoreLedgerOrders] = useState<LiveOrder[]>([]);

  // 1. Counter Open/Closed Toggle State (Synchronized in real time across all devices via Firestore)
  const [isCounterOpen, setIsCounterOpen] = useState<boolean>(false);

  // 2. Auto-Incrementing Guest Number State (Synchronized across all devices)
  const [guestSeqNumber, setGuestSeqNumber] = useState<number>(101);
  const [customerName, setCustomerName] = useState<string>(`Guest #${guestSeqNumber}`);

  // 3. Active Order Ticket (Local to this cashier terminal)
  const [ticketItems, setTicketItems] = useState<{ item: MenuItem; qty: number; milk: string }[]>([]);

  // 4. Live Orders Queue (Synchronized in real time across all devices via Firestore)
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);

  // 5. Collected Revenue & Items Prepared (Synchronized in real time across all devices via Firestore)
  const [collectedRevenue, setCollectedRevenue] = useState<number>(0.00);
  const [itemsCompletedCount, setItemsCompletedCount] = useState<number>(0);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'warn' | 'cancel' } | null>(null);
  
  // Modals state
  const [isDailyProfitModalOpen, setIsDailyProfitModalOpen] = useState(false);

  // 1. Centralized Multi-Device Counter State Listener (Cloud Firestore)
  useEffect(() => {
    const unsub = firebaseService.subscribeToCounterState((state) => {
      setIsCounterOpen(state.isOpen);
      setCollectedRevenue(state.collectedRevenue);
      setItemsCompletedCount(state.itemsCompletedCount);
      setGuestSeqNumber(state.guestSeqNumber);
    });
    return () => unsub();
  }, []);

  // 2. Centralized Multi-Device Live Orders & Kitchen Queue Listener (Cloud Firestore)
  useEffect(() => {
    const unsub = firebaseService.subscribeToLiveOrders((orders) => {
      setLiveOrders(orders || []);
    });
    return () => unsub();
  }, []);

  // 3. Centralized Multi-Device Sales Ledger Listener (Cloud Firestore)
  useEffect(() => {
    const unsub = firebaseService.subscribeToSalesLedger((orders) => {
      setFirestoreLedgerOrders(orders || []);
    });
    return () => unsub();
  }, []);

  // Unified sales orders dataset: Combines Firestore persistent ledger and local live register queue
  const allLedgerOrders = useMemo(() => {
    const map = new Map<string, LiveOrder>();
    
    // 1. Firestore persistent ledger collection
    firestoreLedgerOrders.forEach(order => map.set(order.id, order));
    
    // 2. Local live counter orders
    liveOrders.forEach(order => map.set(order.id, order));

    return Array.from(map.values()).sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));
  }, [firestoreLedgerOrders, liveOrders]);

  // Keep default name in sync with current guest sequence
  useEffect(() => {
    if (!customerName || customerName.startsWith('Guest #')) {
      setCustomerName(`Guest #${guestSeqNumber}`);
    }
  }, [guestSeqNumber]);

  // Map menu item to stock deductions & calculate raw cost basis
  const calculateDeductionsForItems = (items: { item: MenuItem; qty: number; milk?: string }[]): StockDeduction[] => {
    const deductions: StockDeduction[] = [];

    items.forEach(({ item, qty, milk }) => {
      if (item.category.includes('Coffee') || item.category.includes('Cold Brew')) {
        const beanItem = inventory.find(i => 
          i.category === 'Raw Ingredients' || i.category === 'Retail Coffee Beans'
        ) || inventory[0];

        if (beanItem) {
          deductions.push({
            itemId: beanItem.id,
            itemName: beanItem.name,
            amountDeducted: Number((0.018 * qty).toFixed(3)),
            unit: beanItem.unit,
            unitCost: beanItem.unitCost,
          });
        }

        // Dairy/Milk deduction
        if (milk && milk.includes('Oat')) {
          const oatItem = inventory.find(i => i.name.toLowerCase().includes('oat'));
          if (oatItem) {
            deductions.push({
              itemId: oatItem.id,
              itemName: oatItem.name,
              amountDeducted: Number((0.25 * qty).toFixed(2)),
              unit: oatItem.unit,
              unitCost: oatItem.unitCost,
            });
          }
        } else if (milk && milk.includes('Whole')) {
          const wholeItem = inventory.find(i => i.name.toLowerCase().includes('dairy') || i.name.toLowerCase().includes('milk'));
          if (wholeItem) {
            deductions.push({
              itemId: wholeItem.id,
              itemName: wholeItem.name,
              amountDeducted: Number((0.25 * qty).toFixed(2)),
              unit: wholeItem.unit,
              unitCost: wholeItem.unitCost,
            });
          }
        }

        // Packaging Cup deduction
        const cupItem = inventory.find(i => i.category === 'Packaging');
        if (cupItem) {
          deductions.push({
            itemId: cupItem.id,
            itemName: cupItem.name,
            amountDeducted: qty,
            unit: cupItem.unit,
            unitCost: cupItem.unitCost,
          });
        }
      } else if (item.category.includes('Bakery')) {
        const pastryItem = inventory.find(i => 
          i.category === 'Bakery & Pantry' || i.name.toLowerCase().includes('croissant') || i.name.toLowerCase().includes('butter')
        );
        if (pastryItem) {
          deductions.push({
            itemId: pastryItem.id,
            itemName: pastryItem.name,
            amountDeducted: qty,
            unit: pastryItem.unit,
            unitCost: pastryItem.unitCost,
          });
        }
      } else {
        // Brunch / Food
        const pantryItem = inventory.find(i => i.category === 'Bakery & Pantry' || i.category === 'Raw Ingredients');
        if (pantryItem) {
          deductions.push({
            itemId: pantryItem.id,
            itemName: pantryItem.name,
            amountDeducted: qty,
            unit: pantryItem.unit,
            unitCost: pantryItem.unitCost,
          });
        }
      }
    });

    return deductions;
  };

  // Add Item to active ticket
  const handleAddToTicket = (item: MenuItem) => {
    if (!isCounterOpen) {
      setNotification({ msg: 'Please open the Store Counter first to punch orders.', type: 'warn' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setTicketItems(prev => {
      const existingIndex = prev.findIndex(i => i.item.id === item.id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].qty += 1;
        return copy;
      }
      return [...prev, { item, qty: 1, milk: item.category.includes('Coffee') ? 'Oat Milk (Califia)' : 'None' }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setTicketItems(prev => {
      return prev
        .map(i => {
          if (i.item.id === itemId) {
            const nextQty = i.qty + delta;
            return nextQty > 0 ? { ...i, qty: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { item: MenuItem; qty: number; milk: string }[];
    });
  };

  const handleUpdateMilk = (itemId: string, milk: string) => {
    setTicketItems(prev => prev.map(i => i.item.id === itemId ? { ...i, milk } : i));
  };

  // Fire Order & Deplete Stock
  const fireOrder = async () => {
    if (!isCounterOpen || ticketItems.length === 0) return;

    const currentGuest = customerName || `Guest #${guestSeqNumber}`;
    await fireOrderDirectly(currentGuest, ticketItems);
    setTicketItems([]);
  };

  const fireOrderDirectly = async (guestName: string, itemsList: { item: MenuItem; qty: number; milk?: string }[]) => {
    const deductions = calculateDeductionsForItems(itemsList);
    
    // Calculate prices factoring in active Happy Hour discount
    const calculatedItems = itemsList.map(i => {
      const disc = calculateDiscount(i.item);
      const effectivePrice = disc.isDiscounted ? disc.discountedPrice : i.item.price;
      const savingsPerItem = disc.isDiscounted ? disc.savingsAmount : 0;
      return {
        ...i,
        effectivePrice,
        originalPrice: i.item.price,
        isDiscounted: disc.isDiscounted,
        totalSavings: savingsPerItem * i.qty,
      };
    });

    const orderTotal = calculatedItems.reduce((acc, i) => acc + (i.effectivePrice * i.qty), 0);
    const orderTotalSavings = calculatedItems.reduce((acc, i) => acc + i.totalSavings, 0);
    const orderCostBasis = deductions.reduce((acc, d) => acc + (d.amountDeducted * (d.unitCost || 0)), 0);
    const orderNum = guestSeqNumber;

    // 1. Deduct stock quantities in real time
    for (const ded of deductions) {
      const currentItem = inventory.find(inv => inv.id === ded.itemId);
      if (currentItem) {
        const nextQty = Math.max(0, Number((currentItem.quantity - ded.amountDeducted).toFixed(2)));
        await updateStockQuantity(currentItem.id, nextQty);
      }
    }

    // 2. Create Live Order Ticket (status: 'preparing', revenue not collected until paid)
    const newOrder: LiveOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: orderNum,
      customerName: guestName,
      items: calculatedItems.map(i => ({
        menuItemId: i.item.id,
        name: i.item.name,
        quantity: i.qty,
        price: i.effectivePrice,
        originalPrice: i.originalPrice,
        isDiscounted: i.isDiscounted,
        customization: i.milk !== 'None' ? i.milk : undefined,
        category: i.item.category
      })),
      total: orderTotal,
      totalCostBasis: Number(orderCostBasis.toFixed(2)) || Number((orderTotal * 0.28).toFixed(2)),
      totalDiscountSaved: orderTotalSavings,
      paymentMethod: 'UPI / QR',
      status: 'preparing',
      createdAt: Date.now(),
      depletedIngredients: deductions
    };

    // 1. Save directly to Cloud Firestore live queue & sales ledger in real-time
    await firebaseService.saveLiveOrder(newOrder);
    await firebaseService.saveSalesOrder(newOrder);
    
    // 2. Auto-increment guest sequence number across all devices in real-time
    const nextSeq = guestSeqNumber + 1;
    setGuestSeqNumber(nextSeq);
    setCustomerName(`Guest #${nextSeq}`);
    await firebaseService.saveCounterState({ guestSeqNumber: nextSeq });

    setNotification({
      msg: `Order #${newOrder.orderNumber} (${guestName}) sent to kitchen! Deducted ${deductions.length} items.${orderTotalSavings > 0 ? ` (Zero-Waste Discount applied: -${formatCurrency(orderTotalSavings)})` : ''}`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const markOrderReady = async (orderId: string) => {
    await firebaseService.updateLiveOrderStatus(orderId, 'ready');
    const target = liveOrders.find(o => o.id === orderId);
    if (target) {
      await firebaseService.saveSalesOrder({ ...target, status: 'ready' });
    }
  };

  // COMPLETE & COLLECT PAYMENT -> ACCURATELY INCREASES COLLECTED REVENUE & ZERO-WASTE SAVINGS
  const markOrderCompletedAndPaid = async (order: LiveOrder) => {
    if (order.status === 'completed') return;

    const completedAt = Date.now();
    const completedOrder: LiveOrder = {
      ...order,
      status: 'completed',
      completedAt,
      paymentMethod: order.paymentMethod || 'UPI / QR'
    };

    // Update live order and sales ledger in Cloud Firestore
    await firebaseService.updateLiveOrderStatus(order.id, 'completed', completedAt);
    await firebaseService.saveSalesOrder(completedOrder);
    
    // Accurately credit revenue and completed items count in Cloud Firestore
    const totalItemsInOrder = order.items.reduce((acc, it) => acc + it.quantity, 0);
    const newRev = Number((collectedRevenue + order.total).toFixed(2));
    const newCount = itemsCompletedCount + totalItemsInOrder;

    await firebaseService.saveCounterState({
      collectedRevenue: newRev,
      itemsCompletedCount: newCount
    });

    // Track zero-waste recovered savings if discount was applied
    if (order.totalDiscountSaved && order.totalDiscountSaved > 0) {
      trackPurchaseSavings(order.totalDiscountSaved, totalItemsInOrder);
    }

    setNotification({
      msg: `Payment collected for Order #${order.orderNumber} (+${formatCurrency(order.total)})! Completed.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // CANCEL ORDER & REFUND / RESTORE INVENTORY
  const handleCancelOrder = async (order: LiveOrder) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${order.orderNumber} for "${order.customerName}"? Any depleted stock will be restored to inventory.`)) {
      return;
    }

    // 1. Restore depleted stock back to inventory in Cloud Firestore
    for (const ded of order.depletedIngredients) {
      const item = inventory.find(i => i.id === ded.itemId);
      if (item) {
        const restoredQty = Number((item.quantity + ded.amountDeducted).toFixed(2));
        await updateStockQuantity(item.id, restoredQty);
      }
    }

    // 2. If already completed, refund the revenue in Cloud Firestore
    if (order.status === 'completed') {
      const totalItemsInOrder = order.items.reduce((acc, it) => acc + it.quantity, 0);
      const newRev = Math.max(0, Number((collectedRevenue - order.total).toFixed(2)));
      const newCount = Math.max(0, itemsCompletedCount - totalItemsInOrder);
      await firebaseService.saveCounterState({
        collectedRevenue: newRev,
        itemsCompletedCount: newCount
      });
    }

    // 3. Mark as cancelled in Cloud Firestore
    await firebaseService.cancelLiveOrder(order.id);
    const cancelledOrder: LiveOrder = { ...order, status: 'cancelled' };
    await firebaseService.saveSalesOrder(cancelledOrder);

    setNotification({
      msg: `Order #${order.orderNumber} cancelled. Restored ${order.depletedIngredients.length} ingredients to stock.`,
      type: 'cancel'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Clear all completed / cancelled orders from history
  const handleClearFinishedOrders = async () => {
    const finished = liveOrders.filter(o => o.status === 'completed' || o.status === 'cancelled');
    for (const ord of finished) {
      await firebaseService.deleteLiveOrder(ord.id);
    }
    setNotification({ msg: 'Cleared completed & cancelled orders from display queue.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  // HARD RESET ALL REVENUE & ORDERS TO 0 ACROSS ALL DEVICES
  const handleResetAllToZero = async () => {
    if (window.confirm("Reset today's revenue to ₹0.00, clear completed count, and reset order queue to 0 on ALL devices?")) {
      setTicketItems([]);
      setCustomerName('Guest #101');
      await firebaseService.resetCounterState();
      await firebaseService.clearLiveOrders();
      setNotification({ msg: 'All counters, register revenue (₹0.00), and order queues reset to 0 across all devices.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleToggleCounterStatus = async () => {
    const next = !isCounterOpen;
    setIsCounterOpen(next);
    await firebaseService.saveCounterState({ isOpen: next });
    setNotification({
      msg: next ? 'Store Counter is now OPEN & Live across all devices!' : 'Store Counter closed for shift.',
      type: next ? 'success' : 'warn'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculations
  const activeTicketTotal = ticketItems.reduce((acc, i) => {
    const disc = calculateDiscount(i.item);
    const effectivePrice = disc.isDiscounted ? disc.discountedPrice : i.item.price;
    return acc + (effectivePrice * i.qty);
  }, 0);
  const ticketDeductionsPreview = calculateDeductionsForItems(ticketItems);
  const pendingOrdersInQueue = liveOrders.filter(o => o.status === 'preparing' || o.status === 'ready');
  const pendingRevenue = pendingOrdersInQueue.reduce((acc, o) => acc + o.total, 0);

  // Daily profit calculation for KPI card
  const estimatedDailyProfit = Math.max(0, collectedRevenue * 0.72);

  const categories = ['All', 'Espresso & Specialty Coffee', 'Cold Brews & Teas', 'Artisan Bakery', 'All-Day Brunch'];
  const filteredMenuItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(m => m.category === activeCategory);

  return (
    <div className="space-y-8">
      
      {/* Master Store Status & Counter Toggle Banner (Pacific Drip & Ocean Fog Layout) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-7 print:hidden">
        
        {/* Top Row: Title, Live Status & Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-[#D2DFE2]/60">
          
          {/* Left: Brand / Title */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-warm-sm border transition-all ${
                isCounterOpen 
                  ? 'bg-[#10222B] text-[#77C7C6] border-[#1B8585]/40' 
                  : 'bg-stone-100 text-stone-400 border-stone-200'
              }`}>
                {isCounterOpen ? (
                  <Flame className="w-7 h-7 text-[#77C7C6] animate-pulse" />
                ) : (
                  <Power className="w-7 h-7 text-stone-400" />
                )}
              </div>
              {isCounterOpen && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#3BAFA9] rounded-full border-2 border-white animate-ping" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B] tracking-tight">
                  Live Store Order Counter
                </h2>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                  isCounterOpen 
                    ? 'bg-[#EBF7F7] text-[#146868] border-[#A3DEDE]' 
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isCounterOpen ? 'bg-[#1B8585] animate-pulse' : 'bg-stone-400'}`} />
                  {isCounterOpen ? 'Store Counter is OPEN' : 'Store Counter is CLOSED'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {isCounterOpen 
                  ? 'Live register is active. Orders automatically deplete ingredient stocks and collect revenue upon payment.' 
                  : 'Counter is currently closed. Toggle open to begin shift, punch orders, and track live ingredient depletions.'}
              </p>
            </div>
          </div>

          {/* Right: Clean, Single-Row Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* View Overall Sales Ledger Switch */}
            <button
              type="button"
              onClick={() => setCounterView(prev => prev === 'ledger' ? 'pos' : 'ledger')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 border cursor-pointer ${
                counterView === 'ledger'
                  ? 'bg-[#10222B] text-[#77C7C6] border-[#1B8585]'
                  : 'bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] border-[#D2DFE2]'
              }`}
              title="View overall sales ledger distributed by Day, Week, Month, and Year"
            >
              <TrendingUp className="w-4 h-4 text-[#1B8585]" />
              <span>{counterView === 'ledger' ? '← Back to POS Register' : 'Overall Sales Ledger'}</span>
            </button>

            {/* Open / Close Counter Switch */}
            <button
              type="button"
              onClick={handleToggleCounterStatus}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 border ${
                isCounterOpen
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-[#1B8585] hover:bg-[#146868] text-white border-[#1B8585]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isCounterOpen ? 'Close Counter (End Shift)' : '🟢 Open Store Counter'}</span>
            </button>

            {/* Reset to 0 Shortcut */}
            <button
              type="button"
              onClick={handleResetAllToZero}
              className="p-2.5 rounded-xl bg-[#F2F6F7] hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#D2DFE2] transition-colors"
              title="Reset register figures to $0.00"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Counter Live Statistics (Clean, Spacious, Uniform Cards in Pacific Theme) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          
          {/* Card 1: Today's Revenue */}
          <div 
            onClick={() => setIsDailyProfitModalOpen(true)}
            className="p-5 sm:p-6 rounded-2xl bg-[#F2F6F7] hover:bg-white border border-[#D2DFE2]/80 hover:border-[#1B8585]/50 hover:shadow-warm-sm space-y-2 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">Today's Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF7F7] text-[#1B8585] flex items-center justify-center border border-[#A3DEDE] group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {formatCurrency(collectedRevenue)}
            </div>
            <span className="text-[10px] text-stone-400 block">Click to view profit ledger ↗</span>
          </div>

          {/* Card 2: Today's Profit */}
          <div 
            onClick={() => setIsDailyProfitModalOpen(true)}
            className="p-5 sm:p-6 rounded-2xl bg-[#F2F6F7] hover:bg-white border border-[#D2DFE2]/80 hover:border-[#1B8585]/50 hover:shadow-warm-sm space-y-2 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">Today's Profit</span>
              <div className="w-8 h-8 rounded-lg bg-[#EBF7F7] text-[#1B8585] flex items-center justify-center border border-[#A3DEDE] group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {formatCurrency(estimatedDailyProfit)}
            </div>
            <span className="text-[10px] text-stone-400 block">Net after raw ingredients</span>
          </div>

          {/* Card 3: Completed Items */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2]/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">Completed Items</span>
              <div className="w-8 h-8 rounded-lg bg-white text-[#10222B] flex items-center justify-center border border-[#D2DFE2]">
                <Coffee className="w-4 h-4 text-[#1B8585]" />
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {itemsCompletedCount}
            </div>
            <span className="text-[10px] text-stone-400 block">Dispensed & paid</span>
          </div>

          {/* Card 4: Pending Orders */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F2F6F7] border border-[#D2DFE2]/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">Pending Orders</span>
              <div className="w-8 h-8 rounded-lg bg-[#E0ECF4] text-[#1E3A47] flex items-center justify-center border border-[#B5CDE0]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#10222B]">
              {pendingOrdersInQueue.length} <span className="text-sm font-normal text-stone-400">({formatCurrency(pendingRevenue)})</span>
            </div>
            <span className="text-[10px] text-stone-400 block">In kitchen preparation</span>
          </div>

        </div>

        {/* Notifications Toast */}
        {notification && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border animate-slide-up ${
            notification.type === 'cancel'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : notification.type === 'warn'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'cancel' ? (
                <Undo2 className="w-4 h-4 text-amber-700" />
              ) : notification.type === 'warn' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>{notification.msg}</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">Live Counter</span>
          </div>
        )}

        {/* Navigation Mode Switcher: POS Register vs Sales Ledger */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#D2DFE2] self-start shadow-2xs">
          <button
            type="button"
            onClick={() => setCounterView('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              counterView === 'pos'
                ? 'bg-[#10222B] text-[#77C7C6] shadow-warm-xs'
                : 'text-stone-600 hover:text-[#10222B] hover:bg-[#F2F6F7]'
            }`}
          >
            <Coffee className="w-4 h-4 text-[#77C7C6]" />
            <span>POS Register & Kitchen</span>
          </button>

          <button
            type="button"
            onClick={() => setCounterView('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              counterView === 'ledger'
                ? 'bg-[#10222B] text-[#77C7C6] shadow-warm-xs'
                : 'text-stone-600 hover:text-[#10222B] hover:bg-[#F2F6F7]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#1B8585]" />
            <span>Overall Sales Ledger (Day / Week / Month / Year)</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1B8585] text-white text-[10px] font-bold">
              Ledger
            </span>
          </button>
        </div>
      </div>

      {counterView === 'ledger' ? (
        <SalesLedgerSection
          orders={allLedgerOrders}
          isCounterOpen={isCounterOpen}
          collectedRevenue={collectedRevenue}
          onRefresh={() => {
            firebaseService.fetchSalesLedger().then(setFirestoreLedgerOrders);
          }}
        />
      ) : (
        <>
          {/* Main Counter Workspace: POS Touch Grid & Active Ticket */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
        
        {/* Left: Quick Tap Menu Grid (7 Columns) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-6 relative">
          
          {/* Closed Overlay warning if counter is toggled off */}
          {!isCounterOpen && (
            <div className="absolute inset-0 bg-stone-50/85 backdrop-blur-[2px] rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center shadow-xs">
                <Power className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#10222B]">
                Counter Closed
              </h4>
              <p className="text-xs text-stone-500 max-w-sm">
                Open the store counter to begin punching orders and automatically managing recipe stock depletions.
              </p>
              <button
                type="button"
                onClick={handleToggleCounterStatus}
                className="px-6 py-2.5 rounded-xl bg-[#1B8585] hover:bg-[#146868] text-white text-xs font-bold transition-all shadow-warm-sm active:scale-95"
              >
                🟢 Open Store Counter Now
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#10222B]">
                Touch Menu POS
              </h3>
              <p className="text-xs text-stone-500">
                Tap items to build ticket. Recipe ingredients will be depleted from inventory automatically.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeCategory === cat
                    ? 'bg-[#10222B] text-[#F2F6F7] border-[#10222B] shadow-xs'
                    : 'bg-[#F2F6F7] text-stone-600 border-[#D2DFE2] hover:bg-[#E5ECEE]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Touch Item Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredMenuItems.map(item => {
              const disc = calculateDiscount(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddToTicket(item)}
                  className="p-3.5 rounded-2xl bg-[#F2F6F7] hover:bg-white border border-[#D2DFE2]/80 hover:border-[#1B8585] hover:shadow-warm-sm transition-all text-left flex flex-col justify-between space-y-2.5 group active:scale-95 relative overflow-hidden"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#10222B]/90 text-[#77C7C6] font-bold text-[10px] flex items-center gap-1">
                      {disc.isDiscounted ? (
                        <>
                          <span className="line-through text-stone-400 font-normal">{formatCurrency(disc.originalPrice)}</span>
                          <span className="text-amber-300">{formatCurrency(disc.discountedPrice)}</span>
                        </>
                      ) : (
                        formatCurrency(item.price)
                      )}
                    </div>

                    {disc.isDiscounted && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-white" />
                        <span>{disc.discountPercent}% OFF</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#10222B] line-clamp-1 group-hover:text-[#1B8585] transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 block truncate">
                      {item.category}
                    </span>
                  </div>

                  <div className="w-full py-1.5 rounded-lg bg-white group-hover:bg-[#10222B] group-hover:text-[#F2F6F7] text-[#10222B] border border-[#D2DFE2] text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3 text-[#1B8585] group-hover:text-[#77C7C6]" />
                    <span>Add to Ticket</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Ticket & Stock Depletion Preview (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          
          {/* Active Ticket Box */}
          <div className="bg-white p-6 rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#D2DFE2]/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#1B8585]" />
                <h3 className="font-serif font-bold text-lg text-[#10222B]">
                  Active Order Ticket
                </h3>
              </div>

              {ticketItems.length > 0 && (
                <button
                  onClick={() => setTicketItems([])}
                  className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Auto-Incrementing Guest Identifier */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-stone-500 uppercase">
                  Guest Identifier (Auto-Incremented)
                </label>
                <span className="text-[10px] text-[#1B8585] font-mono font-semibold">
                  Seq #{guestSeqNumber}
                </span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={`Guest #${guestSeqNumber}`}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2] text-xs font-semibold text-[#10222B] focus:bg-white focus:border-[#1B8585] focus:outline-none"
                />
              </div>
            </div>

            {/* Ticket Items List */}
            {ticketItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs space-y-2 border-2 border-dashed border-[#D2DFE2]/60 rounded-2xl">
                <Coffee className="w-8 h-8 text-stone-300 mx-auto" />
                <p>Ticket is empty. Tap menu items to punch an order.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {ticketItems.map(({ item, qty, milk }) => (
                  <div key={item.id} className="p-3 rounded-xl bg-[#F2F6F7] border border-[#D2DFE2]/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-serif font-bold text-[#10222B] block">{item.name}</span>
                        <span className="text-[11px] text-stone-500">{formatCurrency(item.price)} each</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#D2DFE2] flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{qty}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#D2DFE2] flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {item.category.includes('Coffee') && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase">Milk:</span>
                        <select
                          value={milk}
                          onChange={(e) => handleUpdateMilk(item.id, e.target.value)}
                          className="text-[10px] font-semibold bg-white border border-[#D2DFE2] rounded-md px-2 py-0.5 text-stone-700 focus:outline-none"
                        >
                          {MILK_OPTIONS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Inventory Deduction Preview */}
            {ticketItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#EBF7F7] border border-[#A3DEDE] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#146868] text-[11px] uppercase tracking-wider">
                  <TrendingDown className="w-3.5 h-3.5 text-[#1B8585]" />
                  <span>Will Deduct from Stock:</span>
                </div>
                <div className="space-y-1">
                  {ticketDeductionsPreview.map((d, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-stone-700">
                      <span>• {d.itemName}</span>
                      <strong className="text-rose-700 font-mono">-{d.amountDeducted} {d.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Total & Fire CTA */}
            <div className="pt-2 border-t border-[#D2DFE2]/60 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-stone-600">Ticket Total:</span>
                <span className="font-serif text-2xl text-[#10222B]">{formatCurrency(activeTicketTotal)}</span>
              </div>

              <button
                type="button"
                disabled={!isCounterOpen || ticketItems.length === 0}
                onClick={fireOrder}
                className="w-full py-3.5 rounded-2xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold uppercase tracking-wider transition-all shadow-warm-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                <Flame className="w-4 h-4 text-[#77C7C6]" />
                <span>Fire Order & Deplete Stock</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Live Kitchen & Barista Display Queue (KDS) */}
      <div className="bg-white rounded-3xl border border-[#D2DFE2]/80 shadow-warm-sm p-6 sm:p-8 space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D2DFE2]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#1B8585]" />
            <h3 className="font-serif font-bold text-xl text-[#10222B]">
              Live Kitchen Queue & Real-Time Orders ({liveOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDailyProfitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-[#10222B] text-xs font-semibold border border-[#D2DFE2] transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#1B8585]" />
              <span>Daily Profit Breakdown</span>
            </button>

            {liveOrders.some(o => o.status === 'completed' || o.status === 'cancelled') && (
              <button
                type="button"
                onClick={handleClearFinishedOrders}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F2F6F7] hover:bg-[#E5ECEE] text-stone-600 text-xs font-semibold border border-[#D2DFE2] transition-colors"
                title="Remove finished and cancelled tickets from queue view"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Clear Finished Orders</span>
              </button>
            )}
          </div>
        </div>

        {liveOrders.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            No active orders in queue. Open counter and punch an order to see live tracking.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveOrders.map(order => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition-all ${
                  order.status === 'preparing'
                    ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                    : order.status === 'ready'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : order.status === 'cancelled'
                    ? 'bg-stone-50 border-rose-200 opacity-60'
                    : 'bg-[#F2F6F7] border-stone-200 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D2DFE2]/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#10222B]">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-stone-600 font-medium truncate max-w-[120px]">
                        {order.customerName}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'preparing'
                        ? 'bg-amber-200 text-amber-900 animate-pulse'
                        : order.status === 'ready'
                        ? 'bg-emerald-200 text-emerald-900'
                        : order.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {order.status === 'preparing' ? '⏳ Preparing' : order.status === 'ready' ? '✅ Ready for Pickup' : order.status === 'cancelled' ? '❌ Cancelled' : 'Paid & Completed'}
                    </span>
                  </div>

                  {/* Ordered Items */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-stone-800">
                        <span><strong>{it.quantity}x</strong> {it.name} {it.customization ? `(${it.customization})` : ''}</span>
                        <span className="font-mono text-stone-500">{formatCurrency(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="flex justify-between items-center pt-1 text-xs font-semibold text-stone-600">
                    <span>Order Value:</span>
                    <span className="font-mono font-bold text-[#10222B] text-sm">{formatCurrency(order.total)}</span>
                  </div>

                  {/* Depleted ingredients tag */}
                  {order.status !== 'cancelled' ? (
                    <div className="text-[10px] text-stone-500 pt-1 border-t border-dashed border-[#D2DFE2]">
                      <span className="font-semibold text-[#1B8585]">Depleted:</span> {order.depletedIngredients.map(d => `${d.itemName} (-${d.amountDeducted}${d.unit})`).join(', ')}
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-700 pt-1 border-t border-dashed border-rose-200 font-semibold">
                      ✓ Ingredients restored to stock
                    </div>
                  )}
                </div>

                {/* Status Action Buttons & Cancel Option */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => markOrderReady(order.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {(order.status === 'ready' || order.status === 'preparing') && (
                      <button
                        onClick={() => markOrderCompletedAndPaid(order)}
                        className="flex-1 py-2 rounded-xl bg-[#10222B] hover:bg-[#1E3A47] text-[#F2F6F7] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        title="Collect payment and credit to store revenue"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#77C7C6]" />
                        <span>Paid & Complete (+{formatCurrency(order.total)})</span>
                      </button>
                    )}
                  </div>

                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      className="w-full py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Cancel this order and refund depleted stock"
                    >
                      <XCircle className="w-3 h-3 text-rose-500" />
                      <span>Cancel Order & Restore Stock</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

          {/* Embedded Overall Sales Ledger Section in Live Counter */}
          <div className="pt-8 border-t border-[#D2DFE2]/70 space-y-4">
            <div className="flex items-center justify-between print:hidden">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#10222B] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#1B8585]" />
                  <span>Overall Sales Ledger & Performance Distribution</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Day-wise, week-wise, month-wise, and year-wise financial ledger and accounting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCounterView('ledger')}
                className="inline-flex items-center gap-1.5 text-xs text-[#1B8585] font-bold hover:underline cursor-pointer"
              >
                <span>Fullscreen Ledger View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <SalesLedgerSection
              orders={allLedgerOrders}
              isCounterOpen={isCounterOpen}
              collectedRevenue={collectedRevenue}
              onRefresh={() => {
                firebaseService.fetchSalesLedger().then(setFirestoreLedgerOrders);
              }}
            />
          </div>
        </>
      )}

      {/* Today's Daily Revenue & Profit Analytics Modal */}
      <DailyProfitAnalyticsModal
        isOpen={isDailyProfitModalOpen}
        onClose={() => setIsDailyProfitModalOpen(false)}
        orders={liveOrders}
        collectedRevenue={collectedRevenue}
        completedItemsCount={itemsCompletedCount}
        onResetRegister={handleResetAllToZero}
      />

    </div>
  );
};
