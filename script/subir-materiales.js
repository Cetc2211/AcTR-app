#!/usr/bin/env node

/**
 * scripts/subir-materiales.mjs
 *
 * Sube los archivos HTML del ecosistema Letras Necias a:
 *   - Firebase Storage: ecosistema/materiales/estacion_cs{N}/{slug}.html
 *   - Firestore: ecosistema_materiales_cs{N}/{slug}
 *
 * Uso:
 *   node scripts/subir-materiales.mjs
 *
 * Requisitos:
 *   - Archivos HTML en la carpeta materiales-temp/ del workspace
 *   - service-account.json en la raíz del proyecto
 *   - firebase-admin instalado: npm install firebase-admin
 *
 * Convención de nombres esperada:
 *   cs1-cap1-novela.html
 *   cs1-cap1-cuadernillo.html
 *   cs1-cap1-guia.html
 *   cs2-cap3-novela.html
 *   etc.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';

// ─── Configuración ────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH = resolve('./service-account.json');
const CARPETA_MATERIALES   = resolve('./materiales-temp');
const BUCKET_NAME          = 'academic-tracker-qeoxi.firebasestorage.app';

// ─── Títulos por tipo ─────────────────────────────────────────────

const TITULOS = {
  novela:       (cap) => `Capitulo ${cap} · Novela`,
  cuadernillo:  (cap) => `Capitulo ${cap} · Cuadernillo`,
  guia:         (cap) => `Capitulo ${cap} · Guia Docente`,
};

// ─── Parsear nombre de archivo ────────────────────────────────────
// Espera: cs1-cap1-novela.html, cs2-cap3-cuadernillo.html, etc.

function parsear(nombreArchivo) {
  const base = basename(nombreArchivo, '.html');
  const match = base.match(/^(cs\d)-(cap\d+)-(novela|cuadernillo|guia)$/i);

  if (!match) return null;

  const [, semestre, capStr, tipoRaw] = match;
  const tipo = tipoRaw.toLowerCase();
  const nCap = parseInt(capStr.replace('cap', ''), 10);

  // orden: cada capítulo ocupa 3 slots (novela=0, cuadernillo=1, guia=2)
  const ordenOffset = { novela: 0, cuadernillo: 1, guia: 2 };
  const orden = (nCap - 1) * 3 + ordenOffset[tipo] + 1;

  const slug = base.toLowerCase();

  return {
    semestre,                                          // cs1
    slug,                                              // cs1-cap1-novela
    tipo,                                              // novela
    orden,                                             // 1
    titulo: TITULOS[tipo](nCap),                       // Capitulo 1 · Novela
    coleccion: `ecosistema_materiales_${semestre}`,    // ecosistema_materiales_cs1
    rutaStorage: `ecosistema/materiales/estacion_${semestre}/${slug}.html`,
  };
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Letras Necias — Cargador de materiales\n');

  // Verificar service account
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('✗  No se encontró service-account.json en la raíz del proyecto.');
    console.error('   Coloca el archivo y vuelve a correr el script.');
    process.exit(1);
  }

  // Verificar carpeta de materiales
  if (!existsSync(CARPETA_MATERIALES)) {
    console.error(`✗  No se encontró la carpeta materiales-temp/`);
    console.error('   Crea la carpeta y coloca los archivos HTML dentro.');
    process.exit(1);
  }

  // Inicializar Firebase Admin
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
  }

  const db     = getFirestore();
  const bucket = getStorage().bucket();

  // Leer archivos HTML de la carpeta
  const archivos = readdirSync(CARPETA_MATERIALES)
    .filter(f => f.endsWith('.html'))
    .sort();

  console.log(`📁  Carpeta: ${CARPETA_MATERIALES}`);
  console.log(`📄  Archivos encontrados: ${archivos.length}\n`);

  if (archivos.length === 0) {
    console.log('⚠   No hay archivos HTML en materiales-temp/');
    process.exit(0);
  }

  let exitosos = 0;
  let omitidos = 0;
  let errores  = 0;

  for (const nombreArchivo of archivos) {
    const meta = parsear(nombreArchivo);

    if (!meta) {
      console.log(`  ⚠  Ignorado (nombre no reconocido): ${nombreArchivo}`);
      omitidos++;
      continue;
    }

    const rutaLocal = join(CARPETA_MATERIALES, nombreArchivo);
    const htmlContent = readFileSync(rutaLocal, 'utf8');

    try {
      // 1. Verificar si ya existe en Firestore
      const docRef  = db.collection(meta.coleccion).doc(meta.slug);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        console.log(`  ↷  Ya existe, omitiendo: ${meta.slug}`);
        omitidos++;
        continue;
      }

      // 2. Subir HTML a Firebase Storage
      const file = bucket.file(meta.rutaStorage);
      await file.save(htmlContent, {
        contentType: 'text/html; charset=utf-8',
        metadata: { cacheControl: 'private, max-age=3600' },
      });

      // 3. Crear documento en Firestore (sin campo html — viene de Storage)
      await docRef.set({
        titulo:  meta.titulo,
        tipo:    meta.tipo,
        orden:   meta.orden,
        slug:    meta.slug,
        activo:  true,
      });

      console.log(`  ✓  ${meta.slug}`);
      console.log(`       Storage:   ${meta.rutaStorage}`);
      console.log(`       Firestore: ${meta.coleccion}/${meta.slug}`);
      exitosos++;

    } catch (err) {
      console.error(`  ✗  Error en ${nombreArchivo}: ${err.message}`);
      errores++;
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`  ✓ Exitosos:  ${exitosos}`);
  console.log(`  ↷ Omitidos:  ${omitidos}`);
  console.log(`  ✗ Errores:   ${errores}`);
  console.log(`  Total:       ${archivos.length} archivos procesados`);
  console.log('\n✅  Listo. Los materiales ya están disponibles en la app.\n');
}

main().catch((err) => {
  console.error('\n✗  Error fatal:', err.message);
  process.exit(1);
});
