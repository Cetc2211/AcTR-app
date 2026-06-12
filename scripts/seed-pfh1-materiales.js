/**
 * Seed script: Crea 48 documentos en ecosistema_materiales_pfh1
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"..."}' \
 *     node scripts/seed-pfh1-materiales.js
 *
 * O si la variable ya está en .env:
 *   node -r dotenv/config scripts/seed-pfh1-materiales.js
 */

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ── Service Account ──────────────────────────────────────
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_ECOSISTEMA
  || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!raw) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_JSON no está configurada');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);
} catch {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_JSON tiene formato JSON inválido');
  process.exit(1);
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(app);

// ── Generar 48 documentos ───────────────────────────────
const TIPOS = ['novela', 'cuadernillo', 'guia'];
const TOTAL_CAPS = 16;

const documentos = [];

let orden = 1;
for (let cap = 1; cap <= TOTAL_CAPS; cap++) {
  for (const tipo of TIPOS) {
    const slug = `pfh1-cap${cap}-${tipo}`;
    const tituloTipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);

    documentos.push({
      id: slug,
      titulo: `Capitulo ${cap} · Panta Rhei · ${tituloTipo}`,
      tipo,
      orden,
      slug,
      activo: true,
    });

    orden++;
  }
}

// ── Escribir en Firestore ────────────────────────────────
async function seed() {
  const colRef = db.collection('ecosistema_materiales_pfh1');
  const batch = db.batch();

  for (const doc of documentos) {
    const { id, ...data } = doc;
    batch.set(colRef.doc(id), data);
  }

  console.log(`Creando ${documentos.length} documentos en ecosistema_materiales_pfh1...`);

  await batch.commit();

  console.log('✓ Seed completado exitosamente.');
  console.log(`  Documentos creados: ${documentos.length}`);
  console.log(`  Rango: pfh1-cap1-novela (orden 1) → pfh1-cap16-guia (orden ${orden - 1})`);

  // Verificación rápida
  const snapshot = await colRef.count().get();
  console.log(`  Verificación: colección tiene ${snapshot.data().count} documentos`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('ERROR durante seed:', err);
  process.exit(1);
});
