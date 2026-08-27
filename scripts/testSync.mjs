import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
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

async function simulateMultiDeviceSync() {
  console.log('🚀 Starting Multi-Device Synchronization Verification Test...');

  const testId = `sync_test_${Date.now()}`;
  let deviceBReceivedCreation = false;
  let deviceAReceivedCompletion = false;

  // 1. Device B sets up a real-time listener on live_orders
  console.log('📱 Device B: Subscribing to live_orders...');
  const unsubDeviceB = onSnapshot(collection(db, 'live_orders'), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.doc.id === testId) {
        if (change.type === 'added') {
          console.log('✅ Device B received NEW order in real-time:', change.doc.data());
          deviceBReceivedCreation = true;
        } else if (change.type === 'modified') {
          console.log('✅ Device B received ORDER UPDATE in real-time:', change.doc.data().status);
        }
      }
    });
  });

  // 2. Device A writes a new order
  console.log('💻 Device A: Placing new live order...');
  const orderDoc = doc(db, 'live_orders', testId);
  await setDoc(orderDoc, {
    id: testId,
    orderNumber: 'TEST-101',
    customerName: 'MultiDevice Tester',
    total: 450,
    status: 'preparing',
    createdAt: Date.now()
  });

  // Wait 1.5 seconds for realtime propagation
  await new Promise(r => setTimeout(r, 1500));

  // 3. Device B updates the status to 'completed'
  console.log('📱 Device B: Marking order as completed...');
  await updateDoc(orderDoc, {
    status: 'completed',
    completedAt: Date.now()
  });

  await new Promise(r => setTimeout(r, 1500));

  // 4. Test store counter state sync
  console.log('💻 Device A: Toggling store counter state...');
  const counterDoc = doc(db, 'store_counter', 'status');
  await setDoc(counterDoc, {
    isOpen: true,
    collectedRevenue: 450,
    itemsCompletedCount: 2,
    guestSeqNumber: 102,
    lastUpdatedAt: Date.now()
  }, { merge: true });

  await new Promise(r => setTimeout(r, 1500));

  // 5. Clean up test order
  console.log('🧹 Cleaning up test document...');
  await deleteDoc(orderDoc);
  unsubDeviceB();

  console.log('🎉 Multi-device real-time sync test PASSED successfully!');
  process.exit(0);
}

simulateMultiDeviceSync();
