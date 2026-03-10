#!/usr/bin/env node

/**
 * Script para configurar el primer administrador en Firestore
 * Ejecutar después del despliegue inicial
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Configuración de Firebase (usar las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function setupInitialAdmin() {
  const adminEmail = "mpceciliotopetecruz@gmail.com"; // Email del administrador inicial

  console.log('🚀 Configurando administrador inicial...');

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Verificar si ya existe
    const adminDocRef = doc(db, 'admins', adminEmail.toLowerCase());
    await setDoc(adminDocRef, {
      createdAt: new Date().toISOString(),
      createdBy: 'system-setup'
    }, { merge: true });

    console.log(`✅ Administrador configurado: ${adminEmail}`);
    console.log('📝 Ahora puedes acceder al panel de administración.');
    console.log('🔧 Para agregar más administradores, ve a /admin en la aplicación.');

  } catch (error) {
    console.error('❌ Error configurando administrador:', error);
    process.exit(1);
  }
}

setupInitialAdmin();