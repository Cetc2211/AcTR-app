// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  projectId: "academic-tracker-qeoxi",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  messagingSenderId: "263108580734",
  appId: "1:263108580734:web:316c14f8e71c20aa038f2f"
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
        // Persistent cache with single-tab manager for cross-browser sync
        localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager()
        }),
        // Network optimizations for limited connections
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: {
            timeoutSeconds: 30  // Shorter timeout to free connections
        }
    });
} catch (e) {
    // Fallback for development hot-reloads if already initialized
    console.log("Firestore already initialized, using existing instance");
    db = getFirestore(app);
}

export { app, auth, db };
