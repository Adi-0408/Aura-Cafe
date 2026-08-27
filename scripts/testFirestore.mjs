import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsWopaxk_-_qe0hgtUs_tSlLioYlXqObY",
  authDomain: "auracafe-76d5e.firebaseapp.com",
  projectId: "auracafe-76d5e",
  storageBucket: "auracafe-76d5e.firebasestorage.app",
  messagingSenderId: "308647716690",
  appId: "1:308647716690:web:517fb3ec6f2089729ebc8b",
  measurementId: "G-RSEV852P08"
};

async function testConnection() {
  console.log('Testing connection to Firebase project:', firebaseConfig.projectId);
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Attempting to read inventory collection...');
    const snapshot = await getDocs(collection(db, 'inventory'));
    console.log(`Successfully connected! Found ${snapshot.size} inventory items in Firestore.`);
    snapshot.forEach(doc => {
      console.log(' - Doc ID:', doc.id, 'Data:', JSON.stringify(doc.data()));
    });

    console.log('Attempting test write...');
    const testRef = doc(db, 'inventory', 'test_sync_probe');
    await setDoc(testRef, { probe: true, timestamp: Date.now() });
    console.log('✅ Write succeeded!');

    await deleteDoc(testRef);
    console.log('✅ Delete test doc succeeded!');
  } catch (err) {
    console.error('❌ Firebase connection / permission test failed:', err);
  }
}

testConnection();
