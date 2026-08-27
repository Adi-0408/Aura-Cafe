import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkAllCollections() {
  const list = [
    'users',
    'inventory',
    'menu_items',
    'tables',
    'reservations',
    'restock_orders',
    'sales_ledger',
    'live_orders',
    'staff_members',
    'store_counter',
    'settings'
  ];

  for (const c of list) {
    const snap = await getDocs(collection(db, c));
    console.log(`=== Collection [${c}] : ${snap.size} documents ===`);
    snap.forEach(d => {
      console.log(`  * ${d.id}:`, JSON.stringify(d.data()).substring(0, 100));
    });
  }
}

checkAllCollections();
