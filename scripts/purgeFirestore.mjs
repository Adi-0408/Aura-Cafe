import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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

const collectionsToPurge = [
  'inventory',
  'menu_items',
  'restock_orders',
  'tables',
  'live_orders'
];

async function purgeDummyCloudData() {
  console.log('Purging all dummy documents from Cloud Firestore...');
  for (const colName of collectionsToPurge) {
    const snap = await getDocs(collection(db, colName));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      console.log(`✅ Cleared ${snap.size} documents from collection "${colName}"`);
    } else {
      console.log(`ℹ️ Collection "${colName}" was already empty.`);
    }
  }
  console.log('🎉 Firestore is now 100% clean and ready for real data across all devices!');
}

purgeDummyCloudData();
