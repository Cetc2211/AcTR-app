#!/usr/bin/env node

/**
 * scripts/re-subir-storage.mjs
 *
 * Re-sube los cuadernillos interactivos a Firebase Storage,
 * SOBRESCRIBIENDO los archivos existentes sin tocar Firestore.
 *
 * Lee de: materiales-temp-interactivos/cs{N}-cap{N}-cuadernillo.html
 * Sube a: ecosistema/materiales/estacion_cs{N}/cs{N}-cap{N}-cuadernillo.html
 *
 * Uso: node scripts/re-subir-storage.mjs
 *
 * Requisitos:
 *   - service-account.json en la raíz del proyecto
 *   - Archivos interactivos en materiales-temp-interactivos/
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';

// ─── Configuración ────────────────────────────────────────────────

const RAIZ = resolve(import.meta.dirname, '..');
const SERVICE_ACCOUNT_PATH = join(RAIZ, 'service-account.json');
const CARPETA_MATERIALES   = join(RAIZ, 'materiales-temp-interactivos');
const BUCKET_NAME          = 'academic-tracker-qeoxi.firebasestorage.app';

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Letras Necias — Re-subir cuadernillos interactivos a Storage\n');

  // Verificar service account
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('✗  No se encontró service-account.json en la raíz del proyecto.');
    console.error('   Coloca el archivo y vuelve a correr el script.');
    process.exit(1);
  }

  // Verificar carpeta de materiales interactivos
  if (!existsSync(CARPETA_MATERIALES)) {
    console.error(`✗  No se encontró la carpeta materiales-temp-interactivos/`);
    console.error('   Ejecuta primero: node scripts/convertir-cuadernillos-interactivos.mjs');
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

  const bucket = getStorage().bucket();

  // Leer solo cuadernillos interactivos
  const archivos = readdirSync(CARPETA_MATERIALES)
    .filter(f => f.match(/^cs[123]-cap\d+-cuadernillo\.html$/))
    .sort();

  console.log(`📁  Carpeta: ${CARPETA_MATERIALES}`);
  console.log(`📄  Cuadernillos interactivos: ${archivos.length}\n`);

  if (archivos.length === 0) {
    console.log('⚠   No hay cuadernillos interactivos en materiales-temp-interactivos/');
    process.exit(0);
  }

  let exitosos = 0;
  let errores  = 0;

  for (const nombreArchivo of archivos) {
    // Parsear nombre: cs1-cap3-cuadernillo.html
    const base = basename(nombreArchivo, '.html');
    const match = base.match(/^(cs\d)-(cap\d+)-cuadernillo$/i);

    if (!match) {
      console.log(`  ⚠  Ignorado (nombre no reconocido): ${nombreArchivo}`);
      continue;
    }

    const [, semestre] = match;
    const slug = base.toLowerCase();
    const rutaStorage = `ecosistema/materiales/estacion_${semestre}/${slug}.html`;

    const rutaLocal = join(CARPETA_MATERIALES, nombreArchivo);
    const htmlContent = readFileSync(rutaLocal, 'utf8');

    try {
      // Subir/Sobrescribir en Storage (sin tocar Firestore)
      const file = bucket.file(rutaStorage);
      await file.save(htmlContent, {
        contentType: 'text/html; charset=utf-8',
        metadata: { cacheControl: 'private, max-age=3600' },
      });

      console.log(`  ✓  ${slug}`);
      console.log(`       → ${rutaStorage}`);
      exitosos++;

    } catch (err) {
      console.error(`  ✗  Error en ${nombreArchivo}: ${err.message}`);
      errores++;
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`  ✓ Subidos:   ${exitosos}`);
  console.log(`  ✗ Errores:   ${errores}`);
  console.log(`  Total:       ${archivos.length} archivos`);
  console.log('\n✅  Cuadernillos interactivos actualizados en Storage.\n');
}

main().catch((err) => {
  console.error('\n✗  Error fatal:', err.message);
  process.exit(1);
});
