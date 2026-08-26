import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebaseConfig';
import { 
  InventoryItem, 
  MenuItem, 
  Reservation, 
  UserProfile, 
  CustomerReservationSummary,
  StockLogEntry,
  TokenLogEntry,
  RestockOrder,
  RestockOrderStatus,
  PromotionSettings,
  CafeTable,
  ReservationStatus,
  TableStatus
} from '../types';
import { INITIAL_INVENTORY, INITIAL_MENU_ITEMS, INITIAL_RESERVATIONS, INITIAL_TABLES } from './mockData';

const INVENTORY_COLLECTION = 'inventory';
const RESTOCK_ORDERS_COLLECTION = 'restock_orders';
const MENU_COLLECTION = 'menu_items';
const RESERVATIONS_COLLECTION = 'reservations';
const USERS_COLLECTION = 'users';
const TABLES_COLLECTION = 'tables';

// --- USER & CUSTOMER DATABASE OPERATIONS ---

export const syncUserToFirestore = async (userProfile: UserProfile & { password?: string }): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userProfile.uid);
    const existingDoc = await getDoc(userRef);
    const existingData = existingDoc.exists() ? existingDoc.data() as (UserProfile & { password?: string }) : null;

    const dataToSave: Record<string, any> = {
      uid: userProfile.uid,
      email: userProfile.email || existingData?.email || '',
      displayName: userProfile.displayName || existingData?.displayName || userProfile.email?.split('@')[0] || 'Customer Member',
      role: userProfile.role || existingData?.role || 'customer',
      password: userProfile.password || existingData?.password || null,
      photoURL: userProfile.photoURL !== undefined ? userProfile.photoURL : (existingData?.photoURL || null),
      phone: userProfile.phone || existingData?.phone || null,
      lastLogin: userProfile.lastLogin || Date.now(),
      createdAt: userProfile.createdAt || existingData?.createdAt || Date.now(),
      provider: userProfile.provider || existingData?.provider || 'email',
      totalReservations: userProfile.totalReservations !== undefined ? userProfile.totalReservations : (existingData?.totalReservations || 0),
      tokenBalance: userProfile.tokenBalance !== undefined ? userProfile.tokenBalance : (existingData?.tokenBalance || 0),
      freeReservationsAvailable: userProfile.freeReservationsAvailable !== undefined ? userProfile.freeReservationsAvailable : (existingData?.freeReservationsAvailable || 0),
      totalLifetimeTokens: userProfile.totalLifetimeTokens !== undefined ? userProfile.totalLifetimeTokens : (existingData?.totalLifetimeTokens || 0),
      tokenHistory: userProfile.tokenHistory || existingData?.tokenHistory || [],
      reservationHistory: userProfile.reservationHistory || existingData?.reservationHistory || [],
      latestReservation: userProfile.latestReservation !== undefined ? userProfile.latestReservation : (existingData?.latestReservation || null),
    };

    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error syncing user profile to Firestore database:', error);
  }
};

export const awardReservationToken = async (email: string, reservationId: string): Promise<{ newBalance: number; freeUnlocked: boolean }> => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    
    let targetDocRef = null;
    let targetData: UserProfile | null = null;

    for (const d of snapshot.docs) {
      const data = d.data() as UserProfile;
      if (data.email && data.email.toLowerCase().trim() === cleanEmail) {
        targetDocRef = doc(db, USERS_COLLECTION, d.id);
        targetData = data;
        break;
      }
    }

    if (!targetDocRef || !targetData) return { newBalance: 1, freeUnlocked: false };

    const currentBalance = targetData.tokenBalance || 0;
    const currentLifetime = targetData.totalLifetimeTokens || 0;
    const currentFree = targetData.freeReservationsAvailable || 0;
    const currentHistory = targetData.tokenHistory || [];

    const newRawTokens = currentBalance + 1;
    const freeUnlocked = newRawTokens >= 10;
    const newBalance = freeUnlocked ? (newRawTokens - 10) : newRawTokens;
    const newFree = freeUnlocked ? (currentFree + 1) : currentFree;

    const logEntry: TokenLogEntry = {
      id: `tok-${Date.now().toString(36)}`,
      reservationId,
      tokensDelta: 1,
      type: 'earned',
      timestamp: Date.now(),
      note: freeUnlocked ? 'Earned +1 Token! Unlocked 1 FREE Reservation Reward 🎉' : 'Earned +1 Token for booking'
    };

    await updateDoc(targetDocRef, {
      tokenBalance: newBalance,
      totalLifetimeTokens: currentLifetime + 1,
      freeReservationsAvailable: newFree,
      tokenHistory: [logEntry, ...currentHistory],
      lastLogin: Date.now()
    });

    return { newBalance, freeUnlocked };
  } catch (error) {
    console.warn('Could not award token in Firestore (using local):', error);
    return { newBalance: 1, freeUnlocked: false };
  }
};

export const redeemFreeReservationToken = async (email: string, reservationId: string): Promise<boolean> => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);

    let targetDocRef = null;
    let targetData: UserProfile | null = null;

    for (const d of snapshot.docs) {
      const data = d.data() as UserProfile;
      if (data.email && data.email.toLowerCase().trim() === cleanEmail) {
        targetDocRef = doc(db, USERS_COLLECTION, d.id);
        targetData = data;
        break;
      }
    }

    if (!targetDocRef || !targetData) return false;

    const currentFree = targetData.freeReservationsAvailable || 0;
    if (currentFree <= 0) return false;

    const currentHistory = targetData.tokenHistory || [];
    const logEntry: TokenLogEntry = {
      id: `tok-${Date.now().toString(36)}`,
      reservationId,
      tokensDelta: 0,
      type: 'redeemed',
      timestamp: Date.now(),
      note: 'Redeemed 1 Free Reservation (100% Surcharge & Fee Waived)'
    };

    await updateDoc(targetDocRef, {
      freeReservationsAvailable: currentFree - 1,
      tokenHistory: [logEntry, ...currentHistory],
      lastLogin: Date.now()
    });

    return true;
  } catch (error) {
    console.warn('Could not record token redemption in Firestore:', error);
    return false;
  }
};

export const adjustUserTokens = async (
  uidOrEmail: string, 
  delta: number, 
  note?: string
): Promise<{ newBalance: number; newFree: number } | null> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);

    let targetDocRef = null;
    let targetData: UserProfile | null = null;

    for (const d of snapshot.docs) {
      const data = d.data() as UserProfile;
      if (d.id === uidOrEmail || (data.email && data.email.toLowerCase().trim() === uidOrEmail.toLowerCase().trim())) {
        targetDocRef = doc(db, USERS_COLLECTION, d.id);
        targetData = data;
        break;
      }
    }

    if (!targetDocRef || !targetData) return null;

    const currentBalance = targetData.tokenBalance || 0;
    const currentFree = targetData.freeReservationsAvailable || 0;
    const currentLifetime = targetData.totalLifetimeTokens || 0;
    const currentHistory = targetData.tokenHistory || [];

    let newBalance = currentBalance + delta;
    let newFree = currentFree;

    // Handle roll-over or clamp
    if (newBalance >= 10) {
      newFree += Math.floor(newBalance / 10);
      newBalance = newBalance % 10;
    } else if (newBalance < 0) {
      newBalance = 0;
    }

    const logEntry: TokenLogEntry = {
      id: `tok-${Date.now().toString(36)}`,
      tokensDelta: delta,
      type: 'admin_adjustment',
      timestamp: Date.now(),
      note: note || (delta > 0 ? `Host credited +${delta} Token(s)` : `Host debited ${delta} Token(s)`)
    };

    await updateDoc(targetDocRef, {
      tokenBalance: newBalance,
      freeReservationsAvailable: newFree,
      totalLifetimeTokens: delta > 0 ? (currentLifetime + delta) : currentLifetime,
      tokenHistory: [logEntry, ...currentHistory]
    });

    return { newBalance, newFree };
  } catch (error) {
    console.error('Error adjusting user tokens in Firestore:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<(UserProfile & { password?: string }) | null> => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      const data = d.data() as UserProfile & { password?: string };
      if (data.email && data.email.toLowerCase().trim() === cleanEmail) {
        return { uid: d.id, ...data };
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding user by email in Firestore:', error);
    return null;
  }
};

export const fetchUsersFromFirestore = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('lastLogin', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
  } catch (error) {
    // Fallback without orderBy if index is building
    try {
      const q = query(collection(db, USERS_COLLECTION));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
    } catch (err) {
      console.error('Error fetching registered customers from Firestore database:', err);
      return [];
    }
  }
};

export const syncReservationToUser = async (reservation: Reservation): Promise<void> => {
  try {
    if (!reservation.email) return;
    const cleanEmail = reservation.email.toLowerCase().trim();

    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    
    let targetDocRef = null;
    let targetUserData: UserProfile | null = null;

    for (const d of snapshot.docs) {
      const data = d.data() as UserProfile;
      if (data.email && data.email.toLowerCase().trim() === cleanEmail) {
        targetDocRef = doc(db, USERS_COLLECTION, d.id);
        targetUserData = data;
        break;
      }
    }

    const summary: CustomerReservationSummary = {
      reservationId: reservation.id,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      seatingPreference: reservation.seatingPreference,
      status: reservation.status,
      specialRequests: reservation.specialRequests,
      createdAt: reservation.createdAt || Date.now()
    };

    if (targetDocRef && targetUserData) {
      const existingHistory = targetUserData.reservationHistory || [];
      const filteredHistory = existingHistory.filter(h => h.reservationId !== reservation.id);
      const updatedHistory = [summary, ...filteredHistory];

      await updateDoc(targetDocRef, {
        phone: reservation.phone || targetUserData.phone || null,
        displayName: reservation.customerName || targetUserData.displayName,
        latestReservation: summary,
        reservationHistory: updatedHistory,
        totalReservations: updatedHistory.length,
        lastLogin: Date.now()
      });
    } else {
      const newUid = `user-${Date.now().toString(36)}`;
      const newRef = doc(db, USERS_COLLECTION, newUid);
      await setDoc(newRef, {
        uid: newUid,
        email: reservation.email,
        displayName: reservation.customerName,
        phone: reservation.phone,
        role: 'customer',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        provider: 'table_booking',
        totalReservations: 1,
        latestReservation: summary,
        reservationHistory: [summary]
      });
    }
  } catch (error) {
    console.warn('Could not attach reservation data to customer in database:', error);
  }
};

// --- INVENTORY OPERATIONS ---

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  try {
    const q = query(collection(db, INVENTORY_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
  } catch (error) {
    console.error('Error fetching inventory from Firestore:', error);
    throw error;
  }
};

export const saveInventoryItem = async (item: InventoryItem): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, item.id);
    await setDoc(itemRef, item, { merge: true });
  } catch (error) {
    console.error('Error saving inventory item to Firestore:', error);
    throw error;
  }
};

export const addStockLog = async (itemId: string, logData: Omit<StockLogEntry, 'id'>): Promise<StockLogEntry> => {
  try {
    const logId = `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const logDocRef = doc(db, INVENTORY_COLLECTION, itemId, 'logs', logId);
    const newEntry: StockLogEntry = {
      id: logId,
      ...logData,
      updatedAt: logData.updatedAt || Date.now()
    };
    await setDoc(logDocRef, newEntry);
    return newEntry;
  } catch (error) {
    console.warn('Could not write stock log to Firestore sub-collection:', error);
    return {
      id: `local-log-${Date.now()}`,
      ...logData,
      updatedAt: Date.now()
    };
  }
};

export const fetchStockLogs = async (itemId: string): Promise<StockLogEntry[]> => {
  try {
    const logsCol = collection(db, INVENTORY_COLLECTION, itemId, 'logs');
    const q = query(logsCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StockLogEntry));
  } catch (error) {
    console.warn('Could not fetch stock logs from Firestore:', error);
    return [];
  }
};

export const updateStockQuantity = async (
  id: string, 
  qty: number, 
  auditMeta?: { previousQty?: number; reason?: StockLogEntry['reason']; userDisplayName?: string; notes?: string }
): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(itemRef, {
      quantity: qty,
      currentStock: qty,
      updatedAt: Date.now(),
      lastRestocked: Date.now()
    });

    // Create audit trail entry
    if (auditMeta && auditMeta.previousQty !== undefined) {
      const delta = qty - auditMeta.previousQty;
      await addStockLog(id, {
        itemId: id,
        previousQty: auditMeta.previousQty,
        newQty: qty,
        changeDelta: delta,
        reason: auditMeta.reason || 'Manual Edit',
        updatedAt: Date.now(),
        userDisplayName: auditMeta.userDisplayName || 'Staff Member',
        notes: auditMeta.notes
      });
    }
  } catch (error) {
    console.error('Error updating stock level in Firestore:', error);
    throw error;
  }
};

export const updateInventoryStock = updateStockQuantity;

export const updateItemPrice = async (id: string, price: number): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(itemRef, {
      price: price,
      unitPrice: price,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating item price in Firestore:', error);
    throw error;
  }
};

export const archiveInventoryItem = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(itemRef, {
      isArchived: true,
      archivedAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error archiving inventory item in Firestore:', error);
    throw error;
  }
};

export const restoreInventoryItem = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(itemRef, {
      isArchived: false,
      archivedAt: null,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error restoring inventory item in Firestore:', error);
    throw error;
  }
};

export const toggleArchiveInventoryItem = async (id: string, isArchived: boolean): Promise<void> => {
  if (isArchived) {
    return archiveInventoryItem(id);
  } else {
    return restoreInventoryItem(id);
  }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting inventory item from Firestore:', error);
    throw error;
  }
};

export const restockAllInventory = async (quantityMap: Record<string, number>): Promise<void> => {
  try {
    const batch = writeBatch(db);
    Object.entries(quantityMap).forEach(([id, addedQty]) => {
      const itemRef = doc(db, INVENTORY_COLLECTION, id);
      batch.update(itemRef, {
        quantity: addedQty,
        currentStock: addedQty,
        lastRestocked: Date.now(),
        updatedAt: Date.now()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error restocking all inventory items batch in Firestore:', error);
    throw error;
  }
};

// --- RESTOCK & PURCHASE ORDER OPERATIONS ---

export const fetchRestockOrders = async (): Promise<RestockOrder[]> => {
  try {
    const q = query(collection(db, RESTOCK_ORDERS_COLLECTION), orderBy('orderedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RestockOrder));
  } catch (error) {
    console.warn('Could not fetch restock orders from Firestore:', error);
    return [];
  }
};

export const saveRestockOrder = async (order: RestockOrder): Promise<void> => {
  try {
    const orderRef = doc(db, RESTOCK_ORDERS_COLLECTION, order.id);
    await setDoc(orderRef, order, { merge: true });
  } catch (error) {
    console.error('Error saving restock order to Firestore:', error);
    throw error;
  }
};

export const updateRestockOrder = async (orderId: string, updates: Partial<RestockOrder>): Promise<void> => {
  try {
    const orderRef = doc(db, RESTOCK_ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, updates as any);
  } catch (error) {
    console.error('Error updating restock order in Firestore:', error);
    throw error;
  }
};

export const deleteRestockOrder = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, RESTOCK_ORDERS_COLLECTION, orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting restock order from Firestore:', error);
    throw error;
  }
};

// --- MENU OPERATIONS ---

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, MENU_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  } catch (error) {
    console.error('Error fetching menu items from Firestore:', error);
    throw error;
  }
};

export const saveMenuItem = async (item: MenuItem): Promise<void> => {
  try {
    const menuRef = doc(db, MENU_COLLECTION, item.id);
    await setDoc(menuRef, item, { merge: true });
  } catch (error) {
    console.error('Error saving menu item to Firestore:', error);
    throw error;
  }
};

export const archiveMenuItem = async (id: string): Promise<void> => {
  try {
    const menuRef = doc(db, MENU_COLLECTION, id);
    await updateDoc(menuRef, {
      isArchived: true,
      archivedAt: Date.now()
    });
  } catch (error) {
    console.error('Error archiving menu item in Firestore:', error);
    throw error;
  }
};

export const restoreMenuItem = async (id: string): Promise<void> => {
  try {
    const menuRef = doc(db, MENU_COLLECTION, id);
    await updateDoc(menuRef, {
      isArchived: false,
      archivedAt: null
    });
  } catch (error) {
    console.error('Error restoring menu item in Firestore:', error);
    throw error;
  }
};

export const toggleMenuItemAvailability = async (id: string, isAvailable: boolean): Promise<void> => {
  try {
    const menuRef = doc(db, MENU_COLLECTION, id);
    await updateDoc(menuRef, {
      isAvailable: isAvailable
    });
  } catch (error) {
    console.error('Error toggling menu availability in Firestore:', error);
    throw error;
  }
};

// --- RESERVATIONS OPERATIONS ---

export const fetchReservations = async (): Promise<Reservation[]> => {
  try {
    const q = query(collection(db, RESERVATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
  } catch (error) {
    console.error('Error fetching reservations from Firestore:', error);
    throw error;
  }
};

export const createReservation = async (reservation: Reservation): Promise<void> => {
  try {
    const resRef = doc(db, RESERVATIONS_COLLECTION, reservation.id);
    await setDoc(resRef, {
      ...reservation,
      createdAt: reservation.createdAt || Date.now()
    });

    // Automatically sync customer's reservation history & contact info to their user profile in Firestore
    await syncReservationToUser(reservation);
  } catch (error) {
    console.error('Error creating reservation in Firestore:', error);
    throw error;
  }
};

export const updateReservationStatus = async (
  id: string, 
  status: ReservationStatus, 
  tableId?: string | null, 
  tableName?: string | null
): Promise<void> => {
  try {
    const resRef = doc(db, RESERVATIONS_COLLECTION, id);
    const snap = await getDoc(resRef);
    const existing = snap.exists() ? snap.data() as Reservation : null;

    const now = Date.now();
    const seatedAtTime = status === 'seated' ? (existing?.seatedAt || now) : (existing?.seatedAt || null);
    const billedAtTime = status === 'billed' ? (existing?.billedAt || now) : (existing?.billedAt || null);
    const completedAtTime = status === 'completed' ? now : (existing?.completedAt || null);

    let turnDuration: number | null = existing?.turnDurationMinutes || null;
    if (status === 'completed' && seatedAtTime) {
      turnDuration = Math.max(1, Math.round((now - seatedAtTime) / 60000));
    }

    const updates: Partial<Reservation> = {
      status,
      updatedAt: now
    };

    if (tableId !== undefined) updates.tableId = tableId;
    if (tableName !== undefined) updates.tableName = tableName;
    if (seatedAtTime) updates.seatedAt = seatedAtTime;
    if (billedAtTime) updates.billedAt = billedAtTime;
    if (completedAtTime) updates.completedAt = completedAtTime;
    if (turnDuration) updates.turnDurationMinutes = turnDuration;

    await updateDoc(resRef, updates);

    // Sync table state in Firestore if table assigned
    const assignedTableId = tableId !== undefined ? tableId : existing?.tableId;
    if (assignedTableId) {
      if (status === 'seated' || status === 'dining') {
        await updateTableStatus(assignedTableId, 'occupied', id, existing?.customerName);
      } else if (status === 'billed') {
        await updateTableStatus(assignedTableId, 'billed', id, existing?.customerName);
      } else if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
        await updateTableStatus(assignedTableId, 'available', null, null);
      }
    }

    // Fetch the updated reservation and sync to user
    const updatedSnap = await getDoc(resRef);
    if (updatedSnap.exists()) {
      await syncReservationToUser({ id: updatedSnap.id, ...updatedSnap.data() } as Reservation);
    }
  } catch (error) {
    console.error('Error updating reservation status in Firestore:', error);
    throw error;
  }
};

export const fetchTables = async (): Promise<CafeTable[]> => {
  try {
    const q = query(collection(db, TABLES_COLLECTION));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return INITIAL_TABLES;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CafeTable));
  } catch (error) {
    console.warn('Using default tables:', error);
    return INITIAL_TABLES;
  }
};

export const updateTableStatus = async (
  tableId: string, 
  status: TableStatus, 
  reservationId?: string | null, 
  customerName?: string | null
): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await setDoc(tableRef, {
      id: tableId,
      status,
      currentReservationId: status === 'available' ? null : (reservationId !== undefined ? reservationId : null),
      currentCustomerName: status === 'available' ? null : (customerName !== undefined ? customerName : null),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync table status to Firestore:', error);
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  try {
    const resRef = doc(db, RESERVATIONS_COLLECTION, id);
    await deleteDoc(resRef);
  } catch (error) {
    console.error('Error deleting reservation from Firestore:', error);
    throw error;
  }
};

export const clearAllReservationsFromFirestore = async (): Promise<void> => {
  try {
    const q = query(collection(db, RESERVATIONS_COLLECTION));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing all reservations from Firestore:', error);
    throw error;
  }
};

// --- STORAGE OPERATIONS ---

export const uploadProductImage = async (file: File, pathPrefix = 'inventory'): Promise<string> => {
  try {
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `${pathPrefix}/${cleanFileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase storage upload fallback (using object URL for local preview):', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};

// --- SEED FIRESTORE UTILITY ---

export const seedFirestore = async (): Promise<{ success: boolean; count: number }> => {
  try {
    const batch = writeBatch(db);

    INITIAL_INVENTORY.forEach(item => {
      const ref = doc(db, INVENTORY_COLLECTION, item.id);
      batch.set(ref, item);
    });

    INITIAL_MENU_ITEMS.forEach(item => {
      const ref = doc(db, MENU_COLLECTION, item.id);
      batch.set(ref, item);
    });

    INITIAL_RESERVATIONS.forEach(item => {
      const ref = doc(db, RESERVATIONS_COLLECTION, item.id);
      batch.set(ref, item);
    });

    await batch.commit();
    return { success: true, count: INITIAL_INVENTORY.length + INITIAL_MENU_ITEMS.length + INITIAL_RESERVATIONS.length };
  } catch (error) {
    console.error('Error seeding Firestore batch:', error);
    throw error;
  }
};

// --- PROMOTIONS & HAPPY HOUR OPERATIONS ---

const SETTINGS_COLLECTION = 'settings';
const PROMOTIONS_DOC_ID = 'promotions';

export const DEFAULT_PROMOTION_SETTINGS: PromotionSettings = {
  eodDiscountEnabled: true,
  discountPercent: 40,
  minutesBeforeClose: 60,
  eligibleCategories: ['Artisan Bakery', 'All-Day Brunch'],
  manualOverrideActive: false,
  manualOverrideExpiresAt: null,
  totalRevenueSaved: 1480,
  totalItemsRescued: 12,
  lastUpdated: Date.now()
};

export const fetchPromotionSettings = async (): Promise<PromotionSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PROMOTIONS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PROMOTION_SETTINGS, ...snap.data() } as PromotionSettings;
    }
    return DEFAULT_PROMOTION_SETTINGS;
  } catch (error) {
    console.warn('Could not fetch promotions settings from Firestore (using fallback):', error);
    return DEFAULT_PROMOTION_SETTINGS;
  }
};

export const savePromotionSettings = async (settings: PromotionSettings): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PROMOTIONS_DOC_ID);
    await setDoc(docRef, {
      ...settings,
      lastUpdated: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn('Could not save promotions settings to Firestore:', error);
  }
};

export const recordDiscountSavings = async (savingsAmount: number, itemsCount: number): Promise<void> => {
  try {
    const current = await fetchPromotionSettings();
    await savePromotionSettings({
      ...current,
      totalRevenueSaved: (current.totalRevenueSaved || 0) + savingsAmount,
      totalItemsRescued: (current.totalItemsRescued || 0) + itemsCount
    });
  } catch (error) {
    console.warn('Could not record discount savings:', error);
  }
};

