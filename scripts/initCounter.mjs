import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function initCleanCounter() {
  await setDoc(doc(db, 'store_counter', 'status'), {
    isOpen: false,
    collectedRevenue: 0,
    itemsCompletedCount: 0,
    guestSeqNumber: 101,
    lastResetAt: Date.now(),
    lastUpdatedAt: Date.now()
  });
  console.log('✅ Store counter initialized to clean default state (Closed, ₹0.00).');
}

initCleanCounter();
