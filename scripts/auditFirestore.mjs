import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';

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

const collectionsToCheck = [
  'inventory',
  'menu_items',
  'reservations',
  'restock_orders',
  'sales_ledger',
  'tables',
  'live_orders',
  'settings'
];

async function inspectAndPurgeDummy() {
  console.log('--- FIRESTORE COLLECTIONS AUDIT ---');
  for (const colName of collectionsToCheck) {
    const snap = await getDocs(collection(db, colName));
    console.log(`Collection "${colName}": ${snap.size} documents found.`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`  - [${d.id}]: ${data.name || data.customerName || data.orderNumber || JSON.stringify(data).substring(0, 60)}`);
    });
  }
}

inspectAndPurgeDummy();
