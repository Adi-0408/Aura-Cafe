import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  InventoryItem, 
  RestockReceiptLog, 
  StockLogEntry, 
  SupplierOrderSheet, 
  SupplierOrderItem,
  RestockOrder,
  RestockOrderItem,
  RestockOrderStatus
} from '../types';
import * as firebaseService from '../services/firebaseService';
import { mockStorage, subscribeToKey } from '../services/mockService';
import { INITIAL_SAMPLE_RESTOCK_ORDERS } from '../services/mockData';

interface InventoryStats {
  totalSkus: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  archivedCount: number;
}

export interface RestockSubmission {
  receiptNo: string;
  receiptImageUrl: string;
  items: { id: string; addQty: number }[];
  supplier?: string;
  notes?: string;
  receivedBy?: string;
}

export interface CreateRestockOrderParams {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items: { itemId: string; quantityOrdered: number; unitCost?: number }[];
  expectedDeliveryDate?: string;
  notes?: string;
  orderedBy?: string;
}

export interface ReceiveDeliveryParams {
  deliveryInvoiceNo?: string;
  deliveryReceiptImageUrl?: string;
  actualQuantities?: Record<string, number>;
  receivedBy?: string;
  notes?: string;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  restockLogs: RestockReceiptLog[];
  restockOrders: RestockOrder[];
  loading: boolean;
  isSyncing: boolean;
  error: string | null;
  stats: InventoryStats;
  criticalRestockItems: InventoryItem[];
  saveItem: (item: InventoryItem) => Promise<void>;
  updateStockQuantity: (
    id: string, 
    qty: number, 
    auditMeta?: { previousQty?: number; reason?: StockLogEntry['reason']; userDisplayName?: string; notes?: string }
  ) => Promise<void>;
  updatePrice: (id: string, newPrice: number) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  restockItem: (id: string, addQty: number, reason?: StockLogEntry['reason']) => Promise<void>;
  restockWithReceipt: (data: RestockSubmission) => Promise<RestockReceiptLog>;
  createRestockOrder: (params: CreateRestockOrderParams) => Promise<RestockOrder>;
  receiveRestockDelivery: (orderId: string, params: ReceiveDeliveryParams) => Promise<void>;
  cancelRestockOrder: (orderId: string) => Promise<void>;
  getIncomingQtyForItem: (itemId: string) => number;
  getActiveRestockOrderForItem: (itemId: string) => RestockOrder | undefined;
  restockAllLowStock: () => Promise<number>;
  getItemLogs: (itemId: string) => Promise<StockLogEntry[]>;
  logStockAdjustment: (itemId: string, previousQty: number, newQty: number, reason: StockLogEntry['reason'], notes?: string) => Promise<void>;
  getSupplierOrderSheets: () => SupplierOrderSheet[];
  seedFirebaseDatabase: () => Promise<{ success: boolean; count: number }>;
  resetToFactoryDefaults: () => void;
  refreshInventory: () => Promise<void>;
  bulkImportItems: (items: InventoryItem[]) => Promise<number>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [restockLogs, setRestockLogs] = useState<RestockReceiptLog[]>(() => {
    const saved = localStorage.getItem('aura_restock_receipt_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [restockOrders, setRestockOrders] = useState<RestockOrder[]>(() => {
    const saved = localStorage.getItem('aura_restock_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });
  const [localStockLogs, setLocalStockLogs] = useState<Record<string, StockLogEntry[]>>(() => {
    const saved = localStorage.getItem('aura_stock_logs_v1');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('aura_restock_receipt_logs', JSON.stringify(restockLogs));
  }, [restockLogs]);

  useEffect(() => {
    localStorage.setItem('aura_restock_orders', JSON.stringify(restockOrders));
  }, [restockOrders]);

  useEffect(() => {
    localStorage.setItem('aura_stock_logs_v1', JSON.stringify(localStockLogs));
  }, [localStockLogs]);

  useEffect(() => {
    // 1. Subscribe to real-time Cloud Firestore inventory sync
    const unsubInv = firebaseService.subscribeToInventory((items) => {
      setInventory(items || []);
      if (items) {
        mockStorage.saveInventory(items);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Firestore realtime inventory fallback to local:', err);
      const local = mockStorage.getInventory();
      setInventory(local || []);
      setLoading(false);
    });

    // 2. Subscribe to real-time Cloud Firestore restock orders sync
    const unsubOrders = firebaseService.subscribeToRestockOrders((orders) => {
      setRestockOrders(orders || []);
    }, (err) => {
      console.warn('Firestore realtime restock orders fallback:', err);
    });

    return () => {
      unsubInv();
      unsubOrders();
    };
  }, []);

  const stats = useMemo<InventoryStats>(() => {
    const active = inventory.filter(i => !i.isArchived);
    const archived = inventory.filter(i => i.isArchived);

    const totalSkus = active.length;
    const totalValuation = active.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
    const lowStockCount = active.filter(i => i.quantity <= i.minThreshold && i.quantity > 0).length;
    const outOfStockCount = active.filter(i => i.quantity <= 0).length;
    const archivedCount = archived.length;

    return {
      totalSkus,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      archivedCount,
    };
  }, [inventory]);

  const criticalRestockItems = useMemo<InventoryItem[]>(() => {
    return inventory
      .filter(item => !item.isArchived && item.quantity <= item.minThreshold)
      .sort((a, b) => (a.quantity / (a.minThreshold || 1)) - (b.quantity / (b.minThreshold || 1)));
  }, [inventory]);

  const saveItem = async (item: InventoryItem) => {
    setIsSyncing(true);
    try {
      await firebaseService.saveInventoryItem(item);
      mockStorage.saveInventoryItem(item);
      setInventory(mockStorage.getInventory());
    } catch (err: any) {
      console.error('Error saving inventory item to Firestore:', err);
      mockStorage.saveInventoryItem(item);
      setInventory(mockStorage.getInventory());
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStockQuantity = async (
    id: string, 
    qty: number, 
    auditMeta?: { previousQty?: number; reason?: StockLogEntry['reason']; userDisplayName?: string; notes?: string }
  ) => {
    setIsSyncing(true);
    const currentItem = inventory.find(i => i.id === id);
    const prevQty = auditMeta?.previousQty !== undefined ? auditMeta.previousQty : (currentItem?.quantity || 0);

    mockStorage.updateStockQuantity(id, qty);
    setInventory(mockStorage.getInventory());

    // Record stock audit log entry
    const delta = Number((qty - prevQty).toFixed(2));
    const newLog: StockLogEntry = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: id,
      itemName: currentItem?.name || 'Inventory Item',
      previousQty: prevQty,
      newQty: qty,
      changeDelta: delta,
      reason: auditMeta?.reason || 'Manual Edit',
      updatedAt: Date.now(),
      userDisplayName: auditMeta?.userDisplayName || 'Staff Member',
      notes: auditMeta?.notes
    };

    setLocalStockLogs(prev => ({
      ...prev,
      [id]: [newLog, ...(prev[id] || [])]
    }));

    try {
      await firebaseService.updateStockQuantity(id, qty, {
        previousQty: prevQty,
        reason: auditMeta?.reason || 'Manual Edit',
        userDisplayName: auditMeta?.userDisplayName,
        notes: auditMeta?.notes
      });
    } catch (err) {
      console.warn('Stock quantity updated locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updatePrice = async (id: string, price: number) => {
    setIsSyncing(true);
    mockStorage.updatePrice(id, price);
    setInventory(mockStorage.getInventory());

    try {
      await firebaseService.updateItemPrice(id, price);
    } catch (err) {
      console.warn('Price updated locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const archiveItem = async (id: string) => {
    setIsSyncing(true);
    const updated = inventory.map(item => item.id === id ? { ...item, isArchived: true, archivedAt: Date.now() } : item);
    mockStorage.saveInventory(updated);
    setInventory(updated);

    try {
      await firebaseService.archiveInventoryItem(id);
    } catch (err) {
      console.warn('Archived locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreItem = async (id: string) => {
    setIsSyncing(true);
    const updated = inventory.map(item => item.id === id ? { ...item, isArchived: false, archivedAt: null } : item);
    mockStorage.saveInventory(updated);
    setInventory(updated);

    try {
      await firebaseService.restoreInventoryItem(id);
    } catch (err) {
      console.warn('Restored locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleArchive = async (id: string) => {
    const target = inventory.find(i => i.id === id);
    if (target?.isArchived) {
      await restoreItem(id);
    } else {
      await archiveItem(id);
    }
  };

  const deleteItem = async (id: string) => {
    setIsSyncing(true);
    try {
      await firebaseService.deleteInventoryItem(id);
      mockStorage.deleteInventoryItem(id);
      setInventory(mockStorage.getInventory());
    } catch (err) {
      console.error('Error deleting inventory item from Firestore:', err);
      mockStorage.deleteInventoryItem(id);
      setInventory(mockStorage.getInventory());
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const restockItem = async (id: string, addQty: number, reason: StockLogEntry['reason'] = 'Received Shipment') => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + addQty;
    await updateStockQuantity(id, newQty, {
      previousQty: item.quantity,
      reason,
      notes: `Restocked +${addQty} ${item.unit}`
    });
  };

  const restockWithReceipt = async (submission: RestockSubmission): Promise<RestockReceiptLog> => {
    setIsSyncing(true);

    const logItems: RestockReceiptLog['itemsRestocked'] = [];
    let totalCost = 0;

    for (const entry of submission.items) {
      const item = inventory.find(i => i.id === entry.id);
      if (item) {
        const newQty = Number((item.quantity + entry.addQty).toFixed(2));
        await updateStockQuantity(item.id, newQty, {
          previousQty: item.quantity,
          reason: 'Restock Delivery',
          notes: `Receipt #${submission.receiptNo}`
        });
        const itemCost = entry.addQty * item.unitCost;
        totalCost += itemCost;

        logItems.push({
          itemId: item.id,
          itemName: item.name,
          quantityAdded: entry.addQty,
          unit: item.unit,
          costBasis: itemCost,
        });
      }
    }

    const newLog: RestockReceiptLog = {
      id: `rcpt-log-${Date.now()}`,
      receiptNo: submission.receiptNo.trim().toUpperCase(),
      receiptImageUrl: submission.receiptImageUrl || 'https://images.unsplash.com/photo-1554415707-9e4c017d23e0?auto=format&fit=crop&w=600&q=80',
      itemsRestocked: logItems,
      totalCost,
      supplierName: submission.supplier || 'Specialty Supplier / Distributor',
      timestamp: Date.now(),
      receivedBy: submission.receivedBy || 'Staff Operations',
      notes: submission.notes,
    };

    setRestockLogs(prev => [newLog, ...prev]);
    setIsSyncing(false);
    return newLog;
  };

  const createRestockOrder = async (params: CreateRestockOrderParams): Promise<RestockOrder> => {
    setIsSyncing(true);

    const orderItems: RestockOrderItem[] = params.items.map(entry => {
      const invItem = inventory.find(i => i.id === entry.itemId);
      const unitCost = entry.unitCost !== undefined ? entry.unitCost : (invItem?.unitCost || 0);
      const totalCost = Number((entry.quantityOrdered * unitCost).toFixed(2));

      return {
        itemId: entry.itemId,
        itemName: invItem?.name || 'Inventory Item',
        sku: invItem?.sku,
        quantityOrdered: entry.quantityOrdered,
        quantityReceived: 0,
        unit: invItem?.unit || 'units',
        unitCost,
        totalCost
      };
    });

    const totalAmount = orderItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: RestockOrder = {
      id: `po-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      supplierName: params.supplierName.trim() || 'Primary Distributor',
      supplierPhone: params.supplierPhone?.trim(),
      supplierEmail: params.supplierEmail?.trim(),
      items: orderItems,
      totalAmount,
      status: 'ordered',
      orderedAt: Date.now(),
      orderedBy: params.orderedBy || 'Staff Operations',
      expectedDeliveryDate: params.expectedDeliveryDate,
      receivedAt: null,
      receivedBy: null,
      notes: params.notes
    };

    setRestockOrders(prev => [newOrder, ...prev]);

    try {
      await firebaseService.saveRestockOrder(newOrder);
    } catch (e) {
      console.warn('Saved restock order locally:', e);
    } finally {
      setIsSyncing(false);
    }

    return newOrder;
  };

  const receiveRestockDelivery = async (orderId: string, params?: ReceiveDeliveryParams): Promise<void> => {
    setIsSyncing(true);
    const targetOrder = restockOrders.find(o => o.id === orderId);
    if (!targetOrder) {
      setIsSyncing(false);
      throw new Error('Restock order not found.');
    }

    const updatedOrderItems = targetOrder.items.map(item => {
      const actualQty = params?.actualQuantities?.[item.itemId] !== undefined 
        ? params.actualQuantities[item.itemId] 
        : item.quantityOrdered;
      return {
        ...item,
        quantityReceived: actualQty
      };
    });

    // Make an updated copy of the inventory array
    const updatedInventory = [...inventory];
    const itemUpdates: { id: string; newQty: number; prevQty: number }[] = [];

    for (const orderItem of updatedOrderItems) {
      const itemIndex = updatedInventory.findIndex(i => i.id === orderItem.itemId);
      if (itemIndex !== -1) {
        const currentItem = updatedInventory[itemIndex];
        const addedQty = orderItem.quantityReceived !== undefined 
          ? orderItem.quantityReceived 
          : orderItem.quantityOrdered;
        const newQty = Number((currentItem.quantity + addedQty).toFixed(2));
        
        updatedInventory[itemIndex] = {
          ...currentItem,
          quantity: newQty,
          updatedAt: Date.now()
        };
        itemUpdates.push({ id: currentItem.id, newQty, prevQty: currentItem.quantity });
      }
    }

    // Save updated inventory to state & local cache immediately
    setInventory(updatedInventory);
    mockStorage.saveInventory(updatedInventory);

    const updatedOrder: RestockOrder = {
      ...targetOrder,
      items: updatedOrderItems,
      status: 'received',
      receivedAt: Date.now(),
      receivedBy: params?.receivedBy || 'Staff Operations',
      deliveryInvoiceNo: params?.deliveryInvoiceNo || null,
      deliveryReceiptImageUrl: params?.deliveryReceiptImageUrl || null,
      notes: params?.notes || targetOrder.notes
    };

    setRestockOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

    try {
      // 1. Sync every stock update to Cloud Firestore
      for (const update of itemUpdates) {
        await firebaseService.updateStockQuantity(update.id, update.newQty, {
          previousQty: update.prevQty,
          reason: 'Restock Delivery',
          userDisplayName: params?.receivedBy || 'Staff Operations',
          notes: `Received delivery for Order #${targetOrder.orderNumber}${params?.deliveryInvoiceNo ? ` (Invoice #${params.deliveryInvoiceNo})` : ''}`
        });
      }

      // 2. Sync restock order status to Cloud Firestore
      await firebaseService.updateRestockOrder(orderId, {
        status: 'received',
        receivedAt: updatedOrder.receivedAt,
        receivedBy: updatedOrder.receivedBy,
        deliveryInvoiceNo: updatedOrder.deliveryInvoiceNo,
        deliveryReceiptImageUrl: updatedOrder.deliveryReceiptImageUrl,
        items: updatedOrder.items,
        notes: updatedOrder.notes
      });
    } catch (e) {
      console.warn('Updated restock order sync note:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const cancelRestockOrder = async (orderId: string): Promise<void> => {
    setIsSyncing(true);
    setRestockOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

    try {
      await firebaseService.updateRestockOrder(orderId, { status: 'cancelled' });
    } catch (e) {
      console.warn('Cancelled restock order locally:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getIncomingQtyForItem = (itemId: string): number => {
    return restockOrders
      .filter(o => o.status === 'ordered' || o.status === 'in_transit')
      .reduce((sum, order) => {
        const match = order.items.find(i => i.itemId === itemId);
        return sum + (match?.quantityOrdered || 0);
      }, 0);
  };

  const getActiveRestockOrderForItem = (itemId: string): RestockOrder | undefined => {
    return restockOrders.find(
      o => (o.status === 'ordered' || o.status === 'in_transit') && o.items.some(i => i.itemId === itemId)
    );
  };

  const restockAllLowStock = async (): Promise<number> => {
    setIsSyncing(true);
    const lowStock = inventory.filter(i => !i.isArchived && i.quantity <= i.minThreshold);
    if (lowStock.length === 0) {
      setIsSyncing(false);
      return 0;
    }

    const updated = inventory.map(item => {
      if (!item.isArchived && item.quantity <= item.minThreshold) {
        const parLevel = Math.max(item.optimalParLevel || 0, item.minThreshold * 2.5, item.minThreshold + 15);
        const newQty = Math.max(parLevel, item.quantity + 15);
        return { ...item, quantity: newQty, updatedAt: Date.now() };
      }
      return item;
    });

    mockStorage.saveInventory(updated);
    setInventory(updated);

    try {
      for (const item of lowStock) {
        const parLevel = Math.max(item.optimalParLevel || 0, item.minThreshold * 2.5, item.minThreshold + 15);
        const newQty = Math.max(parLevel, item.quantity + 15);
        await firebaseService.updateStockQuantity(item.id, newQty, {
          previousQty: item.quantity,
          reason: 'Daily Audit',
          notes: 'Automated batch replenishment to par-level'
        });
      }
    } catch (err) {
      console.warn('Restocked locally, Firestore batch sync note:', err);
    } finally {
      setIsSyncing(false);
    }

    return lowStock.length;
  };

  const getItemLogs = async (itemId: string): Promise<StockLogEntry[]> => {
    try {
      const remoteLogs = await firebaseService.fetchStockLogs(itemId);
      if (remoteLogs && remoteLogs.length > 0) {
        return remoteLogs;
      }
    } catch (e) {
      console.warn('Using local stock logs cache:', e);
    }
    return localStockLogs[itemId] || [];
  };

  const logStockAdjustment = async (
    itemId: string, 
    previousQty: number, 
    newQty: number, 
    reason: StockLogEntry['reason'], 
    notes?: string
  ) => {
    const item = inventory.find(i => i.id === itemId);
    const delta = newQty - previousQty;
    const newLog: StockLogEntry = {
      id: `log-${Date.now()}`,
      itemId,
      itemName: item?.name || 'Item',
      previousQty,
      newQty,
      changeDelta: delta,
      reason,
      updatedAt: Date.now(),
      userDisplayName: 'Operations Team',
      notes
    };

    setLocalStockLogs(prev => ({
      ...prev,
      [itemId]: [newLog, ...(prev[itemId] || [])]
    }));

    try {
      await firebaseService.addStockLog(itemId, {
        itemId,
        previousQty,
        newQty,
        changeDelta: delta,
        reason,
        updatedAt: Date.now(),
        userDisplayName: 'Operations Team',
        notes
      });
    } catch (e) {
      console.warn('Stock log stored locally:', e);
    }
  };

  // Compile dynamic Par-Level supplier order sheets
  const getSupplierOrderSheets = (): SupplierOrderSheet[] => {
    const lowStockItems = inventory.filter(i => !i.isArchived && i.quantity <= i.minThreshold);
    const supplierGroups: Record<string, InventoryItem[]> = {};

    lowStockItems.forEach(item => {
      const sup = item.supplier || 'Primary Foodservice Distributor';
      if (!supplierGroups[sup]) supplierGroups[sup] = [];
      supplierGroups[sup].push(item);
    });

    return Object.entries(supplierGroups).map(([supplierName, items]) => {
      const orderItems: SupplierOrderItem[] = items.map(item => {
        const parLevel = Math.max(item.optimalParLevel || 0, item.minThreshold * 2.5, item.minThreshold + 15);
        const suggestedReorderQty = Math.max(10, Math.ceil(parLevel - item.quantity));
        const estimatedCost = suggestedReorderQty * item.unitCost;

        return {
          item,
          currentStock: item.quantity,
          optimalParLevel: parLevel,
          suggestedReorderQty,
          unitCost: item.unitCost,
          estimatedCost,
        };
      });

      const totalCost = orderItems.reduce((acc, curr) => acc + curr.estimatedCost, 0);
      const firstItem = items[0];

      return {
        supplierName,
        supplierPhone: firstItem.supplierPhone || '+91 98200 44321',
        supplierEmail: firstItem.supplierEmail || `orders@${supplierName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        items: orderItems,
        totalCost,
        generatedAt: Date.now(),
        generatedBy: 'Aura Operations Suite'
      };
    });
  };

  const refreshInventory = async () => {
    try {
      setLoading(true);
      const items = await firebaseService.fetchInventory();
      if (items && items.length > 0) {
        setInventory(items);
        mockStorage.saveInventory(items);
      }
      const orders = await firebaseService.fetchRestockOrders();
      if (orders && orders.length > 0) {
        setRestockOrders(orders);
      }
    } catch (e) {
      console.warn('Manual refresh inventory note:', e);
    } finally {
      setLoading(false);
    }
  };

  const seedFirebaseDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await firebaseService.seedFirestore();
      await refreshInventory();
      return res;
    } catch (err) {
      console.warn('Error seeding Firebase, reset local dataset instead:', err);
      mockStorage.resetToDefaults();
      setInventory(mockStorage.getInventory());
      return { success: true, count: mockStorage.getInventory().length };
    } finally {
      setIsSyncing(false);
    }
  };

  const bulkImportItems = async (newItems: InventoryItem[]): Promise<number> => {
    setIsSyncing(true);
    try {
      // 1. Batch sync directly to Firestore database
      await firebaseService.batchSaveInventoryItems(newItems);

      // 2. Optimistic state merge with current inventory
      const existingMap = new Map(inventory.map(i => [i.id, i]));
      newItems.forEach(item => {
        existingMap.set(item.id, item);
      });
      const updatedList = Array.from(existingMap.values());
      setInventory(updatedList);
      mockStorage.saveInventory(updatedList);

      return newItems.length;
    } catch (err) {
      console.error('Batch import failed to sync to Firestore:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToFactoryDefaults = () => {
    mockStorage.resetToDefaults();
    setInventory(mockStorage.getInventory());
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        restockLogs,
        restockOrders,
        loading,
        isSyncing,
        error,
        stats,
        criticalRestockItems,
        saveItem,
        updateStockQuantity,
        updatePrice,
        toggleArchive,
        archiveItem,
        restoreItem,
        deleteItem,
        restockItem,
        restockWithReceipt,
        createRestockOrder,
        receiveRestockDelivery,
        cancelRestockOrder,
        getIncomingQtyForItem,
        getActiveRestockOrderForItem,
        restockAllLowStock,
        getItemLogs,
        logStockAdjustment,
        getSupplierOrderSheets,
        seedFirebaseDatabase,
        resetToFactoryDefaults,
        refreshInventory,
        bulkImportItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
