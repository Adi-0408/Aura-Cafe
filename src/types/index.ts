export type DietaryTag = 'VG' | 'V' | 'GF' | 'DF' | 'N' | 'ORG';

export interface DietaryTagInfo {
  tag: DietaryTag;
  label: string;
  fullName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export type InventoryCategory = 
  | 'Raw Ingredients' 
  | 'Retail Coffee Beans' 
  | 'Dairy & Alt' 
  | 'Packaging' 
  | 'Bakery & Pantry';

export type InventoryUnit = 'kg' | 'g' | 'L' | 'ml' | 'packs' | 'units' | 'boxes' | 'bags';

export interface SupplierContact {
  name?: string;
  phone?: string;
  email?: string;
}

export interface StockLogEntry {
  id: string;
  itemId: string;
  itemName?: string;
  previousQty: number;
  newQty: number;
  changeDelta: number;
  reason: 'Received Shipment' | 'Waste / Spillage' | 'Daily Audit' | 'Manual Edit' | 'Live Store Order' | 'Restock Delivery' | 'Barcode Scan';
  updatedAt: number;
  userId?: string;
  userDisplayName?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  quantity: number;
  minThreshold: number;
  optimalParLevel?: number;
  unitCost: number;
  price: number;
  supplier: string;
  supplierPhone?: string;
  supplierEmail?: string;
  location: string;
  imageUrl: string;
  isArchived: boolean;
  isPerishable?: boolean;
  archivedAt?: number | null;
  updatedAt: string | number;
  notes?: string;
}

export interface SupplierOrderItem {
  item: InventoryItem;
  currentStock: number;
  optimalParLevel: number;
  suggestedReorderQty: number;
  unitCost: number;
  estimatedCost: number;
}

export interface SupplierOrderSheet {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items: SupplierOrderItem[];
  totalCost: number;
  generatedAt: number;
  generatedBy: string;
}

export type MenuCategory = 
  | 'Espresso & Specialty Coffee' 
  | 'Cold Brews & Teas' 
  | 'Artisan Bakery' 
  | 'All-Day Brunch';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  dietaryTags: DietaryTag[];
  isAvailable: boolean;
  imageUrl: string;
  prepTime?: string;
  tastingNotes?: string[];
  featured?: boolean;
  isArchived?: boolean;
  isPerishable?: boolean;
  archivedAt?: number | null;
  linkedInventoryId?: string;
}

export type SeatingArea = 
  | 'Indoor Main Lounge' 
  | 'Sunlit Garden Patio' 
  | 'Private Tasting Nook';

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'dining' 
  | 'billed' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type TableStatus = 'available' | 'occupied' | 'dining' | 'reserved' | 'billed' | 'dirty';

export interface CafeTable {
  id: string;
  tableNumber?: string;
  name: string;
  seatingArea: SeatingArea;
  capacity: number;
  minCapacity?: number;
  zone?: 'Indoor Main' | 'Window' | 'Patio' | 'Private Nook';
  perks?: string[];
  status: TableStatus;
  isActive?: boolean;
  currentReservationId?: string | null;
  currentCustomerName?: string | null;
  seatedAt?: number | null;
  billedAt?: number | null;
}

export type PaymentMethod = 'online' | 'at_location' | 'token_redemption';
export type PaymentStatus = 'paid' | 'pending_at_venue' | 'waived';

export interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: SeatingArea;
  specialRequests?: string;
  status: ReservationStatus;
  tableId?: string | null;
  tableName?: string | null;
  baseFee?: number;
  surchargeRate?: number;
  surchargeAmount?: number;
  totalAmountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  isFreeRewardRedeemed?: boolean;
  tokenAwarded?: boolean;
  tokensAwarded?: number;
  seatedAt?: number | null;
  billedAt?: number | null;
  completedAt?: number | null;
  turnDurationMinutes?: number | null;
  updatedAt?: number | null;
  createdAt: string | number;
}

export type UserRole = 'admin' | 'staff' | 'customer';

export interface TokenLogEntry {
  id: string;
  reservationId?: string;
  tokensDelta: number;
  type: 'earned' | 'redeemed' | 'admin_adjustment';
  timestamp: number;
  note?: string;
}

export interface CustomerReservationSummary {
  reservationId: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: string;
  status: ReservationStatus;
  tableName?: string | null;
  seatedAt?: number | null;
  completedAt?: number | null;
  specialRequests?: string;
  createdAt: number | string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  phone?: string | null;
  photoURL?: string | null;
  lastLogin?: number;
  createdAt?: number;
  provider?: string;
  totalReservations?: number;
  tokenBalance?: number; // Current progress towards 10 (0 - 9)
  freeReservationsAvailable?: number; // Unlocked free booking rewards
  totalLifetimeTokens?: number; // Cumulative earned
  tokenHistory?: TokenLogEntry[];
  reservationHistory?: CustomerReservationSummary[];
  latestReservation?: CustomerReservationSummary | null;
}

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived';

export interface CafeStatus {
  isOpen: boolean;
  statusText: string;
  nextTransition: string;
  currentTime?: string;
  currentDay?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
  aspectRatio?: string;
}

// Live Store Order Counter types
export interface OrderItemEntry {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  isDiscounted?: boolean;
  customization?: string;
}

export interface StockDeduction {
  itemId: string;
  itemName: string;
  amountDeducted: number;
  unit: string;
  unitCost?: number;
}

export interface LiveOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  items: OrderItemEntry[];
  total: number;
  totalCostBasis?: number;
  totalDiscountSaved?: number;
  status: 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  depletedIngredients: StockDeduction[];
}

export type RestockOrderStatus = 'ordered' | 'in_transit' | 'received' | 'cancelled';

export interface RestockOrderItem {
  itemId: string;
  itemName: string;
  sku?: string;
  quantityOrdered: number;
  quantityReceived?: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface RestockOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items: RestockOrderItem[];
  totalAmount: number;
  status: RestockOrderStatus;
  orderedAt: number;
  orderedBy: string;
  expectedDeliveryDate?: string;
  receivedAt?: number | null;
  receivedBy?: string | null;
  deliveryReceiptImageUrl?: string | null;
  deliveryInvoiceNo?: string | null;
  notes?: string;
}

export interface RestockReceiptLog {
  id: string;
  receiptNo: string;
  receiptImageUrl: string;
  itemsRestocked: {
    itemId: string;
    itemName: string;
    quantityAdded: number;
    unit: string;
    costBasis: number;
  }[];
  totalCost: number;
  supplierName: string;
  timestamp: number;
  receivedBy: string;
  notes?: string;
}

// Dynamic Happy Hour & Zero-Waste Discount Types
export interface PromotionSettings {
  eodDiscountEnabled: boolean;
  discountPercent: number; // e.g., 40 for 40% off
  minutesBeforeClose: number; // e.g., 60 minutes
  eligibleCategories: string[]; // ['Artisan Bakery', 'All-Day Brunch', 'Bakery & Pantry']
  manualOverrideActive: boolean;
  manualOverrideExpiresAt?: number | null;
  totalRevenueSaved: number;
  totalItemsRescued: number;
  lastUpdated?: number;
}

export interface ItemDiscountCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  isDiscounted: boolean;
  savingsAmount: number;
  badgeLabel?: string;
}
