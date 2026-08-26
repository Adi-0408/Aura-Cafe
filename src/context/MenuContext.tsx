import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { MenuItem, MenuCategory, DietaryTag } from '../types';
import * as firebaseService from '../services/firebaseService';
import { mockStorage, subscribeToKey } from '../services/mockService';

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
      if (items && items.length > 0) {
        setMenuItems(items);
        mockStorage.saveMenu(items);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Firestore realtime menu fallback to local:', err);
      const local = mockStorage.getMenu();
      setMenuItems(local);
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
    mockStorage.saveMenuItem(item);
    setMenuItems(mockStorage.getMenu());

    try {
      await firebaseService.saveMenuItem(item);
    } catch (err) {
      console.warn('Menu item saved locally:', err);
    } finally {
      setIsSyncing(false);
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
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesNotes = item.tastingNotes?.some(note => note.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [menuItems, selectedCategory, selectedDietaryTags, searchQuery]);

  const refreshMenu = async () => {
    try {
      setLoading(true);
      const items = await firebaseService.fetchMenuItems();
      if (items && items.length > 0) {
        setMenuItems(items);
        mockStorage.saveMenu(items);
      }
    } catch (e) {
      console.warn('Manual menu refresh note:', e);
    } finally {
      setLoading(false);
    }
  };

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
        refreshMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
