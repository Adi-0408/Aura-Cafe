import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

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

const sanitizeForFirestore = (data) => {
  if (data === null || data === undefined) return {};
  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else if (Array.isArray(val)) {
        clean[key] = val.map(item => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item));
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
};

async function testAddProduct() {
  console.log('Testing adding product with optional/undefined fields...');
  
  const testId = `inv_test_${Date.now()}`;
  const testProduct = {
    id: testId,
    name: 'Real Test Product Sync',
    sku: 'SKU-SYNC-101',
    category: 'Raw Ingredients',
    unit: 'kg',
    quantity: 15,
    minThreshold: 5,
    unitCost: 250,
    price: 500,
    supplier: 'Test Supplier Co.',
    supplierPhone: '',
    supplierEmail: '',
    notes: undefined, // test undefined handling
    updatedAt: Date.now()
  };

  const clean = sanitizeForFirestore(testProduct);
  const ref = doc(db, 'inventory', testId);
  await setDoc(ref, clean, { merge: true });
  console.log('✅ Added test product to Firestore successfully!');

  const fetched = await getDoc(ref);
  console.log('✅ Fetched back:', fetched.data().name, 'qty:', fetched.data().quantity);

  await deleteDoc(ref);
  console.log('✅ Cleaned up test doc.');
  process.exit(0);
}

testAddProduct();
