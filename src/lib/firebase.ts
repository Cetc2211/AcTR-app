import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuracion base de Firebase para modulos cliente.
// Se priorizan variables de entorno y se mantienen fallbacks para no romper entornos existentes.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academic-tracker-qeoxi.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academic-tracker-qeoxi",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academic-tracker-qeoxi.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "263108580734",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:263108580734:web:316c14f8e71c20aa038f2f",
};

// Evita inicializacion duplicada durante hot-reload en desarrollo.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export { app };
export default app;
