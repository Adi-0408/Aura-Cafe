import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Reservation, ReservationStatus, CafeTable, TableStatus } from '../types';
import * as firebaseService from '../services/firebaseService';
import { mockStorage, subscribeToKey } from '../services/mockService';

interface ReservationContextType {
  reservations: Reservation[];
  tables: CafeTable[];
  loading: boolean;
  isSyncing: boolean;
  createReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => Promise<Reservation>;
  updateStatus: (id: string, status: ReservationStatus, tableId?: string | null, tableName?: string | null) => Promise<void>;
  assignTable: (reservationId: string, tableId: string) => Promise<void>;
  releaseTable: (tableId: string) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  clearAllReservations: () => Promise<void>;
  refreshReservations: () => Promise<void>;
  getBookedTableIds: (date: string, time: string) => string[];
  isTableAvailable: (tableId: string, date: string, time: string) => boolean;
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    seated: number;
    dining: number;
    billed: number;
    completed: number;
    cancelled: number;
    no_show: number;
    occupiedTablesCount: number;
    availableTablesCount: number;
    averageTurnDurationMinutes: number;
  };
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<CafeTable[]>(mockStorage.getTables());
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    // 1. Realtime Firestore reservations subscription
    const unsubRes = firebaseService.subscribeToReservations((res) => {
      setReservations(res);
      mockStorage.saveReservations(res);
      setLoading(false);
    }, (err) => {
      console.warn('Firestore realtime reservations fallback:', err);
      setReservations(mockStorage.getReservations());
      setLoading(false);
    });

    // 2. Realtime Firestore tables subscription
    const unsubTables = firebaseService.subscribeToTables((tbls) => {
      if (tbls && tbls.length > 0) {
        setTables(tbls);
        mockStorage.saveTables(tbls);
      }
    }, (err) => {
      console.warn('Firestore realtime tables fallback:', err);
      setTables(mockStorage.getTables());
    });

    return () => {
      unsubRes();
      unsubTables();
    };
  }, []);

  const createReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'status'>): Promise<Reservation> => {
    setIsSyncing(true);
    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now().toString(36).toUpperCase()}`,
      status: 'pending',
      createdAt: Date.now(),
    };

    mockStorage.createReservation(newReservation);
    setReservations(mockStorage.getReservations());

    try {
      await firebaseService.createReservation(newReservation);
    } catch (err) {
      console.warn('Reservation saved locally, Firestore sync pending:', err);
    } finally {
      setIsSyncing(false);
    }

    return newReservation;
  };

  const updateStatus = async (
    id: string, 
    status: ReservationStatus, 
    tableId?: string | null, 
    tableName?: string | null
  ) => {
    setIsSyncing(true);

    // If tableName not provided but tableId is, look up name
    let finalTableName = tableName;
    if (tableId && !finalTableName) {
      const foundTable = tables.find(t => t.id === tableId);
      if (foundTable) finalTableName = foundTable.name;
    }

    mockStorage.updateReservationStatus(id, status, tableId, finalTableName);
    setReservations(mockStorage.getReservations());
    setTables(mockStorage.getTables());

    try {
      await firebaseService.updateReservationStatus(id, status, tableId, finalTableName);
    } catch (err) {
      console.warn('Reservation status updated locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const assignTable = async (reservationId: string, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    await updateStatus(reservationId, 'seated', tableId, table.name);
  };

  const releaseTable = async (tableId: string) => {
    mockStorage.releaseTable(tableId);
    setTables(mockStorage.getTables());
    try {
      await firebaseService.updateTableStatus(tableId, 'available', null, null);
    } catch (err) {
      console.warn('Table status updated locally:', err);
    }
  };

  const deleteReservation = async (id: string) => {
    setIsSyncing(true);
    mockStorage.deleteReservation(id);
    setReservations(mockStorage.getReservations());
    setTables(mockStorage.getTables());

    try {
      await firebaseService.deleteReservation(id);
    } catch (err) {
      console.warn('Reservation deleted locally, Firestore note:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllReservations = async () => {
    setIsSyncing(true);
    mockStorage.saveReservations([]);
    setReservations([]);

    // Free all occupied tables
    const resetTables = tables.map(t => ({ ...t, status: 'available' as TableStatus, currentReservationId: null, currentCustomerName: null }));
    mockStorage.saveTables(resetTables);
    setTables(resetTables);

    try {
      await firebaseService.clearAllReservationsFromFirestore();
    } catch (err) {
      console.warn('Cleared locally, Firestore note:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getBookedTableIds = (date: string, time: string): string[] => {
    return reservations
      .filter(r => 
        r.date === date && 
        r.time === time && 
        r.status !== 'cancelled' && 
        r.status !== 'no_show' && 
        r.status !== 'completed' &&
        r.tableId
      )
      .map(r => r.tableId as string);
  };

  const isTableAvailable = (tableId: string, date: string, time: string): boolean => {
    const bookedIds = getBookedTableIds(date, time);
    return !bookedIds.includes(tableId);
  };

  const stats = useMemo(() => {
    const completedReservations = reservations.filter(r => r.status === 'completed' && r.turnDurationMinutes);
    const totalTurnMinutes = completedReservations.reduce((sum, r) => sum + (r.turnDurationMinutes || 0), 0);
    const avgTurn = completedReservations.length > 0 
      ? Math.round(totalTurnMinutes / completedReservations.length) 
      : 45;

    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      seated: reservations.filter(r => r.status === 'seated').length,
      dining: reservations.filter(r => r.status === 'dining').length,
      billed: reservations.filter(r => r.status === 'billed').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      no_show: reservations.filter(r => r.status === 'no_show').length,
      occupiedTablesCount: tables.filter(t => t.status === 'occupied' || t.status === 'billed').length,
      availableTablesCount: tables.filter(t => t.status === 'available').length,
      averageTurnDurationMinutes: avgTurn,
    };
  }, [reservations, tables]);

  const refreshReservations = async () => {
    try {
      setLoading(true);
      const [fbReservations, fbTables] = await Promise.all([
        firebaseService.fetchReservations(),
        firebaseService.fetchTables()
      ]);
      if (fbReservations) setReservations(fbReservations);
      if (fbTables && fbTables.length > 0) setTables(fbTables);
    } catch (e) {
      console.warn('Manual reservations refresh note:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        tables,
        loading,
        isSyncing,
        createReservation,
        updateStatus,
        assignTable,
        releaseTable,
        deleteReservation,
        clearAllReservations,
        refreshReservations,
        getBookedTableIds,
        isTableAvailable,
        stats,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
