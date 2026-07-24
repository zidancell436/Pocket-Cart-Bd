import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyAo0xKsbIMykc8DESOTJ2Aq2Ej-fw89wWw",
  authDomain: firebaseConfigData.authDomain || "pocket-cart-bd-dcf50.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "pocket-cart-bd-dcf50",
  storageBucket: firebaseConfigData.storageBucket || "pocket-cart-bd-dcf50.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "903160223042",
  appId: firebaseConfigData.appId || "1:903160223042:web:83c4393da327ebf42b64db",
  measurementId: firebaseConfigData.measurementId || ""
};

// Initialize Firebase App safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore safely
let firestoreDb;
try {
  const customDbId = firebaseConfigData.firestoreDatabaseId;
  if (customDbId && customDbId !== "(default)" && customDbId.trim().length > 0) {
    firestoreDb = getFirestore(app, customDbId);
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (err) {
  console.warn("Could not initialize custom database ID, falling back to default getFirestore(app):", err);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// Initialize Firebase Auth safely
export const auth = getAuth(app);

