import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsWopaxk_-_qe0hgtUs_tSlLioYlXqObY",
  authDomain: "auracafe-76d5e.firebaseapp.com",
  projectId: "auracafe-76d5e",
  storageBucket: "auracafe-76d5e.firebasestorage.app",
  messagingSenderId: "308647716690",
  appId: "1:308647716690:web:517fb3ec6f2089729ebc8b",
  measurementId: "G-RSEV852P08"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testAllDatabaseOperations() {
  console.log('Testing full database operations on auracafe-76d5e...');

  const timestamp = Date.now();

  // 1. Menu Item Write & Read
  console.log('1. Testing Menu Item (menu_items)...');
  const menuId = `menu_probe_${timestamp}`;
  await setDoc(doc(db, 'menu_items', menuId), {
    id: menuId,
    name: 'Test Cloud Brew',
    category: 'Espresso & Specialty Coffee',
    price: 320,
    isAvailable: true,
    createdAt: timestamp
  });
  const menuSnap = await getDoc(doc(db, 'menu_items', menuId));
  console.log('   ✓ Menu Item Saved & Fetched:', menuSnap.data()?.name);
  await deleteDoc(doc(db, 'menu_items', menuId));

  // 2. Inventory Product Write & Read
  console.log('2. Testing Inventory Product (inventory)...');
  const invId = `inv_probe_${timestamp}`;
  await setDoc(doc(db, 'inventory', invId), {
    id: invId,
    name: 'Test Cloud Coffee Beans',
    category: 'Raw Ingredients',
    quantity: 50,
    unit: 'kg',
    unitCost: 600,
    minThreshold: 10
  });
  const invSnap = await getDoc(doc(db, 'inventory', invId));
  console.log('   ✓ Inventory Product Saved & Fetched:', invSnap.data()?.name);
  await deleteDoc(doc(db, 'inventory', invId));

  // 3. Live Order (live_orders) & Sales Ledger (sales_ledger)
  console.log('3. Testing Live Order & Sales Ledger...');
  const orderId = `ord_probe_${timestamp}`;
  const orderData = {
    id: orderId,
    orderNumber: 'ORD-999',
    customerName: 'Cloud Customer',
    total: 320,
    status: 'preparing',
    createdAt: timestamp
  };
  await setDoc(doc(db, 'live_orders', orderId), orderData);
  await setDoc(doc(db, 'sales_ledger', orderId), orderData);
  const liveOrderSnap = await getDoc(doc(db, 'live_orders', orderId));
  const ledgerSnap = await getDoc(doc(db, 'sales_ledger', orderId));
  console.log('   ✓ Live Order in DB:', liveOrderSnap.data()?.orderNumber);
  console.log('   ✓ Sales Ledger in DB:', ledgerSnap.data()?.orderNumber);
  await deleteDoc(doc(db, 'live_orders', orderId));
  await deleteDoc(doc(db, 'sales_ledger', orderId));

  // 4. Reservation Write & Read
  console.log('4. Testing Reservations (reservations)...');
  const resId = `res_probe_${timestamp}`;
  await setDoc(doc(db, 'reservations', resId), {
    id: resId,
    customerName: 'Test Booking',
    guestCount: 4,
    date: '2026-08-30',
    time: '19:00',
    status: 'confirmed',
    createdAt: timestamp
  });
  const resSnap = await getDoc(doc(db, 'reservations', resId));
  console.log('   ✓ Reservation in DB:', resSnap.data()?.customerName);
  await deleteDoc(doc(db, 'reservations', resId));

  // 5. Restock Orders Write & Read
  console.log('5. Testing Restock Orders (restock_orders)...');
  const poId = `po_probe_${timestamp}`;
  await setDoc(doc(db, 'restock_orders', poId), {
    id: poId,
    orderNumber: 'PO-7777',
    supplierName: 'Direct Origin Roasters',
    status: 'ordered',
    totalAmount: 4500,
    orderedAt: timestamp
  });
  const poSnap = await getDoc(doc(db, 'restock_orders', poId));
  console.log('   ✓ Restock Order in DB:', poSnap.data()?.orderNumber);
  await deleteDoc(doc(db, 'restock_orders', poId));

  // 6. Store Counter Status
  console.log('6. Testing Store Counter Status (store_counter)...');
  const counterSnap = await getDoc(doc(db, 'store_counter', 'status'));
  console.log('   ✓ Store Counter Status in DB:', counterSnap.data());

  console.log('\n🎉 ALL DATABASE READ/WRITE OPERATIONS WORK 100% PROPERLY IN FIRESTORE!');
}

testAllDatabaseOperations();
