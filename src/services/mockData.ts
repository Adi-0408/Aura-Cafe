import { InventoryItem, MenuItem, Reservation, GalleryItem, DietaryTagInfo, CafeTable, RestockOrder } from '../types';

export const DIETARY_TAGS_META: Record<string, DietaryTagInfo> = {
  VG: {
    tag: 'VG',
    label: 'Vegan',
    fullName: '100% Plant-Based (Vegan)',
    colorClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    description: 'Contains zero animal products, eggs, honey, or dairy.',
  },
  V: {
    tag: 'V',
    label: 'Vegetarian',
    fullName: 'Vegetarian',
    colorClass: 'text-green-800',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    description: 'Plant-forward recipe; may contain ethically sourced dairy or eggs.',
  },
  GF: {
    tag: 'GF',
    label: 'Gluten-Free',
    fullName: 'Gluten-Free Recipe',
    colorClass: 'text-amber-800',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    description: 'Crafted without gluten-containing grains (cross-contact protocol followed).',
  },
  DF: {
    tag: 'DF',
    label: 'Dairy-Free',
    fullName: 'Dairy-Free',
    colorClass: 'text-sky-800',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    description: 'Prepared using organic oat, almond, or coconut milk alternatives.',
  },
  N: {
    tag: 'N',
    label: 'Contains Nuts',
    fullName: 'Nut Allergen Alert',
    colorClass: 'text-orange-800',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    description: 'Contains tree nuts (almonds, pistachios, hazelnuts, or walnuts).',
  },
};

// Clean default states - NO dummy data populated by default
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_MENU_ITEMS: MenuItem[] = [];
export const INITIAL_RESERVATIONS: Reservation[] = [];
export const INITIAL_TABLES: CafeTable[] = [];
export const INITIAL_SAMPLE_RESTOCK_ORDERS: RestockOrder[] = [];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Manual Pour Over Station',
    caption: 'Single origin beans extracted at precision water temperatures using Japanese glass drippers.',
    category: 'Coffee Craft',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    aspectRatio: 'landscape'
  },
  {
    id: 'gal-2',
    title: 'Artisan Laminated Pastries',
    caption: 'Baked fresh every morning with Normandy cultured butter and 72-hour sourdough levain.',
    category: 'Bakery & Food',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
    aspectRatio: 'landscape'
  }
];

export const GALLERY_ITEMS = INITIAL_GALLERY;
