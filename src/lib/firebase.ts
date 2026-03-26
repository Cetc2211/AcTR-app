// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for academic-tracker-qeoxi project
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
const db = getFirestore(app);
git add src/hooks/use-data.tsx
git commit -m "fix: corregir cálculo de calificaciones filtrando actividades huérfanas y redondeo"
git push origin main
export { app, auth, db };
