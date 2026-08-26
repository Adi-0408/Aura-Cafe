import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsWopaxk_-_qe0hgtUs_tSlLioYlXqObY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auracafe-76d5e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auracafe-76d5e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auracafe-76d5e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "308647716690",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:308647716690:web:517fb3ec6f2089729ebc8b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RSEV852P08"
};

// Initialize Firebase safely
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization note: Running with fallback config if offline', error);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, firebaseConfig };
