import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

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

let db: any;
try {
    // Intentar inicializar con caché persistente y soporte offline/múltiples pestañas
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        }),
        experimentalAutoDetectLongPolling: true, 
        ignoreUndefinedProperties: true 
    });
} catch (e) {
    // Si falla (por ejemplo, en SSR o si ya está inicializado de otra forma), fallback estándar
    console.warn("Firestore persistence failed, falling back to standard getFirestore:", e);
    db = getFirestore(app);
}

export { app, auth, db };
