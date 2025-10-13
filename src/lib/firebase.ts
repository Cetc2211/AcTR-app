// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    "projectId": "actracker-master",
    "appId": "1:660718374201:web:4889a6d15d8aee23ddace8",
    "storageBucket": "actracker-master.firebasestorage.app",
    "apiKey": "AIzaSyCDy-W8_3sB3WS8gVKZuzV_P6PdG1tBOUc",
    "authDomain": "actracker-master.firebaseapp.com",
    "messagingSenderId": "660718374201"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
