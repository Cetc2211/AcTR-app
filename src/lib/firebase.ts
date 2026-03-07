// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache, memoryLruGarbageCollector } from 'firebase/firestore';

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

// Initialize Firestore with Memory Cache optimized for f1-micro (512MB RAM)
// Uses aggressive garbage collection to prevent memory exhaustion
import { Firestore } from 'firebase/firestore';
let db: Firestore;

try {
    db = initializeFirestore(app, {
        // Memory cache with 5MB limit and LRU garbage collection
        localCache: memoryLocalCache({
            garbageCollector: memoryLruGarbageCollector({
                cacheSizeBytes: 5 * 1024 * 1024  // 5MB max cache for f1-micro
            })
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
