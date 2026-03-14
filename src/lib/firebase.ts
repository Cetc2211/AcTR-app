// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, FirestoreSettings, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academic-tracker-qeoxi.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academic-tracker-qeoxi",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academic-tracker-qeoxi.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "263108580734",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:263108580734:web:316c14f8e71c20aa038f2f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with Persistent Cache for cross-device sync
// Uses IndexedDB for physical persistence, survives tab closures and device switches
import { Firestore } from 'firebase/firestore';
let db: Firestore;

try {
    db = initializeFirestore(app, {
        // Persistent cache with MULTI-TAB manager for proper synchronization across tabs
        // This fixes the issue where multiple tabs/devices had inconsistent data
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        }),
        // Network optimizations for limited connections
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: {
            timeoutSeconds: 30  // Shorter timeout to free connections
        },
        // Enable better offline behavior
        ignoreUndefinedProperties: true
    } as FirestoreSettings);
} catch (e) {
    // Fallback for development hot-reloads if already initialized
    console.log("Firestore already initialized, using existing instance");
    db = getFirestore(app);
}

export { app, auth, db };
