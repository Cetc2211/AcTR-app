/**
 * Seed script: Crea 24 documentos en ecosistema_materiales_pfh3
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' node scripts/seed-pfh3-materiales.js
 *
 * O si la variable ya está en .env:
 *   node -r dotenv/config scripts/seed-pfh3-materiales.js
 */

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

const TIPOS = ['novela', 'cuadernillo', 'guia'];
const TOTAL_CAPS = 8;

const documentos = [];

let orden = 1;
for (let cap = 1; cap <= TOTAL_CAPS; cap++) {
  for (const tipo of TIPOS) {
    const slug = `pfh3-cap${cap}-${tipo}`;
    const tituloTipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);

    documentos.push({
      id: slug,
      titulo: `Capitulo ${cap} · La Llama y la Sombra · ${tituloTipo}`,
      tipo,
      orden,
      slug,
      activo: true,
    });

    orden++;
  }
}

async function seed() {
  const colRef = db.collection('ecosistema_materiales_pfh3');
  const batch = db.batch();

  for (const doc of documentos) {
    const { id, ...data } = doc;
    batch.set(colRef.doc(id), data);
  }

  console.log(`Creando ${documentos.length} documentos en ecosistema_materiales_pfh3...`);

  await batch.commit();

  console.log('✓ Seed completado exitosamente.');
  console.log(`  Documentos creados: ${documentos.length}`);
  console.log(`  Rango: pfh3-cap1-novela (orden 1) → pfh3-cap8-guia (orden ${orden - 1})`);

  const snapshot = await colRef.count().get();
  console.log(`  Verificación: colección tiene ${snapshot.data().count} documentos`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('ERROR durante seed:', err);
  process.exit(1);
});
