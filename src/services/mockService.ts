import { InventoryItem, MenuItem, Reservation, CafeTable, ReservationStatus, TableStatus } from '../types';
import { INITIAL_INVENTORY, INITIAL_MENU_ITEMS, INITIAL_RESERVATIONS, INITIAL_TABLES } from './mockData';

const STORAGE_KEYS = {
  INVENTORY: 'aura_cafe_inventory_v1',
  MENU: 'aura_cafe_menu_v1',
  RESERVATIONS: 'aura_cafe_reservations_v1',
  TABLES: 'aura_cafe_tables_v1',
};

// Listeners for real-time reactivity
type Listener = () => void;
const listeners: { [key: string]: Set<Listener> } = {
  inventory: new Set(),
  menu: new Set(),
  reservations: new Set(),
  tables: new Set(),
};

const notify = (key: string) => {
  if (listeners[key]) {
    listeners[key].forEach(cb => cb());
  }
};

export const subscribeToKey = (key: string, callback: Listener) => {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(callback);
  return () => {
    listeners[key]?.delete(callback);
  };
};

export const mockStorage = {
  // INVENTORY
  getInventory: (): InventoryItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
        return INITIAL_INVENTORY;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_INVENTORY;
    }
  },

  saveInventory: (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    notify('inventory');
  },

  saveInventoryItem: (item: InventoryItem) => {
    const current = mockStorage.getInventory();
    const index = current.findIndex(i => i.id === item.id);
    let updated: InventoryItem[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...item, updatedAt: Date.now() };
    } else {
      updated = [{ ...item, updatedAt: Date.now() }, ...current];
    }
    mockStorage.saveInventory(updated);
  },

  updateStockQuantity: (id: string, quantity: number) => {
    const current = mockStorage.getInventory();
    const updated = current.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, quantity), updatedAt: Date.now() } : item
    );
    mockStorage.saveInventory(updated);
  },

  updatePrice: (id: string, price: number) => {
    const current = mockStorage.getInventory();
    const updated = current.map(item =>
      item.id === id ? { ...item, price: Math.max(0, price), updatedAt: Date.now() } : item
    );
    mockStorage.saveInventory(updated);
  },

  toggleArchive: (id: string) => {
    const current = mockStorage.getInventory();
    const updated = current.map(item =>
      item.id === id ? { ...item, isArchived: !item.isArchived, updatedAt: Date.now() } : item
    );
    mockStorage.saveInventory(updated);
  },

  deleteInventoryItem: (id: string) => {
    const current = mockStorage.getInventory();
    const updated = current.filter(item => item.id !== id);
    mockStorage.saveInventory(updated);
  },

  // MENU
  getMenu: (): MenuItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
        return INITIAL_MENU_ITEMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  },

  saveMenu: (items: MenuItem[]) => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
    notify('menu');
  },

  saveMenuItem: (item: MenuItem) => {
    const current = mockStorage.getMenu();
    const index = current.findIndex(i => i.id === item.id);
    let updated: MenuItem[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = item;
    } else {
      updated = [item, ...current];
    }
    mockStorage.saveMenu(updated);
  },

  deleteMenuItem: (id: string) => {
    const current = mockStorage.getMenu();
    const updated = current.filter(item => item.id !== id);
    mockStorage.saveMenu(updated);
  },

  toggleMenuItemAvailability: (id: string, isAvailable: boolean) => {
    const current = mockStorage.getMenu();
    const updated = current.map(item =>
      item.id === id ? { ...item, isAvailable } : item
    );
    mockStorage.saveMenu(updated);
  },

  // TABLES
  getTables: (): CafeTable[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TABLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
        return INITIAL_TABLES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TABLES;
    }
  },

  saveTables: (tables: CafeTable[]) => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    notify('tables');
  },

  updateTableStatus: (tableId: string, status: TableStatus, reservationId?: string | null, customerName?: string | null) => {
    const tables = mockStorage.getTables();
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status,
          currentReservationId: status === 'available' ? null : (reservationId !== undefined ? reservationId : t.currentReservationId),
          currentCustomerName: status === 'available' ? null : (customerName !== undefined ? customerName : t.currentCustomerName),
          seatedAt: (status === 'occupied' || status === 'dining') ? (t.seatedAt || Date.now()) : (status === 'available' ? null : t.seatedAt),
          billedAt: status === 'billed' ? Date.now() : (status === 'available' ? null : t.billedAt),
        };
      }
      return t;
    });
    mockStorage.saveTables(updated);
  },

  releaseTable: (tableId: string) => {
    mockStorage.updateTableStatus(tableId, 'available', null, null);
  },

  // RESERVATIONS
  getReservations: (): Reservation[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveReservations: (items: Reservation[]) => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(items));
    notify('reservations');
  },

  createReservation: (reservation: Reservation) => {
    const current = mockStorage.getReservations();
    const updated = [reservation, ...current];
    mockStorage.saveReservations(updated);
  },

  updateReservationStatus: (
    id: string, 
    status: ReservationStatus, 
    tableId?: string | null, 
    tableName?: string | null
  ) => {
    const current = mockStorage.getReservations();
    const target = current.find(r => r.id === id);
    if (!target) return;

    const now = Date.now();
    const seatedAtTime = status === 'seated' ? (target.seatedAt || now) : target.seatedAt;
    const billedAtTime = status === 'billed' ? (target.billedAt || now) : target.billedAt;
    const completedAtTime = status === 'completed' ? now : target.completedAt;
    
    let turnDuration: number | null = target.turnDurationMinutes || null;
    if (status === 'completed' && seatedAtTime) {
      turnDuration = Math.max(1, Math.round((now - seatedAtTime) / 60000));
    }

    const assignedTableId = tableId !== undefined ? tableId : target.tableId;
    const assignedTableName = tableName !== undefined ? tableName : target.tableName;

    const updated = current.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          tableId: assignedTableId,
          tableName: assignedTableName,
          seatedAt: seatedAtTime,
          billedAt: billedAtTime,
          completedAt: completedAtTime,
          turnDurationMinutes: turnDuration,
          updatedAt: now
        };
      }
      return item;
    });

    mockStorage.saveReservations(updated);

    // Sync Table Occupancy Lifecycle
    if (assignedTableId) {
      if (status === 'seated' || status === 'dining') {
        mockStorage.updateTableStatus(assignedTableId, 'occupied', id, target.customerName);
      } else if (status === 'billed') {
        mockStorage.updateTableStatus(assignedTableId, 'billed', id, target.customerName);
      } else if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
        mockStorage.releaseTable(assignedTableId);
      }
    }
  },

  deleteReservation: (id: string) => {
    const current = mockStorage.getReservations();
    const target = current.find(r => r.id === id);
    if (target?.tableId) {
      mockStorage.releaseTable(target.tableId);
    }
    const updated = current.filter(item => item.id !== id);
    mockStorage.saveReservations(updated);
  },

  // RESET / RE-SEED
  resetToDefaults: () => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    notify('inventory');
    notify('menu');
    notify('reservations');
    notify('tables');
  }
};
