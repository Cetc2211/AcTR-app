#!/usr/bin/env node

/**
 * Script para configurar el primer administrador en Firestore
 * Ejecutar después del despliegue inicial
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// Función para cargar variables de entorno desde .env
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env no encontrado.');
    console.error('📝 Crea un archivo .env en la raíz del proyecto con las variables de Firebase.');
    console.error('   Puedes copiar de .env.example y completar los valores.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Cargar variables de entorno
const envVars = loadEnvFile();

// Verificar que las variables requeridas estén configuradas
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes en .env:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Completa el archivo .env con los valores correctos.');
  console.error('🔍 Obtén los valores desde: https://console.firebase.google.com/project/academic-tracker-qeoxi/settings/general/web');
  process.exit(1);
}

// Configuración de Firebase
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function setupInitialAdmin() {
  const adminEmail = "mpceciliotopetecruz@gmail.com"; // Email del administrador inicial

  console.log('🚀 Configurando administrador inicial...');

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Authenticate anonymously for setup
    console.log('🔐 Autenticando anónimamente...');
    await signInAnonymously(auth);
    console.log('✅ Autenticación anónima exitosa');

    // Create admin document
    console.log('👤 Creando documento de administrador...');
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