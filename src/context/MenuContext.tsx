import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { MenuItem, MenuCategory, DietaryTag } from '../types';
import * as firebaseService from '../services/firebaseService';
import { mockStorage } from '../services/mockService';

interface MenuContextType {
  menuItems: MenuItem[];
  loading: boolean;
  isSyncing: boolean;
  selectedCategory: MenuCategory | 'All';
  selectedDietaryTags: DietaryTag[];
  searchQuery: string;
  filteredItems: MenuItem[];
  setSelectedCategory: (category: MenuCategory | 'All') => void;
  toggleDietaryFilter: (tag: DietaryTag) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>;
  saveMenuItem: (item: MenuItem) => Promise<void>;
  bulkImportMenuItems: (items: MenuItem[]) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<DietaryTag[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToMenuItems((items) => {
      setMenuItems(items || []);
      if (items) {
        mockStorage.saveMenu(items);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Firestore realtime menu fallback to local:', err);
      const local = mockStorage.getMenu();
      setMenuItems(local || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleDietaryFilter = (tag: DietaryTag) => {
    setSelectedDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedDietaryTags([]);
    setSearchQuery('');
  };

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    setIsSyncing(true);
    mockStorage.toggleMenuItemAvailability(id, isAvailable);
    setMenuItems(mockStorage.getMenu());

    try {
      await firebaseService.toggleMenuItemAvailability(id, isAvailable);
    } catch (err) {
      console.warn('Menu availability updated locally:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveMenuItem = async (item: MenuItem) => {
    setIsSyncing(true);
    try {
      await firebaseService.saveMenuItem(item);
      mockStorage.saveMenuItem(item);
      setMenuItems(mockStorage.getMenu());
    } catch (err: any) {
      console.error('Error saving menu item to Firestore:', err);
      mockStorage.saveMenuItem(item);
      setMenuItems(mockStorage.getMenu());
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const bulkImportMenuItems = async (itemsToImport: MenuItem[]) => {
    setIsSyncing(true);
    try {
      await firebaseService.batchSaveMenuItems(itemsToImport);
      const existingMap = new Map(menuItems.map(m => [m.id, m]));
      itemsToImport.forEach(item => {
        existingMap.set(item.id, item);
      });
      const merged = Array.from(existingMap.values());
      setMenuItems(merged);
      mockStorage.saveMenu(merged);
    } catch (err) {
      console.error('Error bulk importing menu items to Firestore:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    setIsSyncing(true);
    try {
      await firebaseService.deleteMenuItem(id);
      mockStorage.deleteMenuItem(id);
      setMenuItems(mockStorage.getMenu());
    } catch (err) {
      console.error('Error deleting menu item from Firestore:', err);
      mockStorage.deleteMenuItem(id);
      setMenuItems(mockStorage.getMenu());
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshMenu = async () => {
    setLoading(true);
    try {
      const items = await firebaseService.fetchMenuItems();
      setMenuItems(items);
      mockStorage.saveMenu(items);
    } catch (err) {
      console.warn('Could not refresh menu from cloud:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category check
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Dietary tags check (must have all selected tags)
      if (selectedDietaryTags.length > 0) {
        const hasAllTags = selectedDietaryTags.every(t => item.dietaryTags.includes(t));
        if (!hasAllTags) return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesNotes = item.tastingNotes?.some(note => note.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesNotes;
      }
      return true;
    });
  }, [menuItems, selectedCategory, selectedDietaryTags, searchQuery]);

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        loading,
        isSyncing,
        selectedCategory,
        selectedDietaryTags,
        searchQuery,
        filteredItems,
        setSelectedCategory,
        toggleDietaryFilter,
        clearFilters,
        setSearchQuery,
        toggleAvailability,
        saveMenuItem,
        bulkImportMenuItems,
        deleteMenuItem,
        refreshMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
