'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// NOTA: El dominio .appspot.com es el identificador correcto que el SDK de cliente
// espera para el storageBucket, aunque en la consola de GCloud aparezca como .firebasestorage.app.
// Ambas direcciones apuntan al mismo recurso.
const firebaseConfig = {
  apiKey: "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oao",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  projectId: "academic-tracker-qeoxi",
  storageBucket: "academic-tracker-qeoxi.appspot.com",
  messagingSenderId: "263108580734",
  appId: "1:263108580734:web:316c14f8e71c20aa038f2f"
};


// Initialize Firebase
// Using a singleton pattern to avoid re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
