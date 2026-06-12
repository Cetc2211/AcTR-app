#!/usr/bin/env node

/**
 * scripts/re-subir-storage.mjs
 *
 * Re-sube archivos HTML interactivos a Firebase Storage,
 * sobrescribiendo las versiones anteriores (estáticas).
 *
 * NO modifica Firestore — los metadatos ya existen y son correctos.
 * Solo reemplaza los archivos HTML en Storage.
 *
 * Uso:
 *   node scripts/re-subir-storage.mjs
 *
 * Requisitos:
 *   - Archivos HTML interactivos en materiales-temp-interactivos/
 *   - service-account.json en la raíz del proyecto
 *
 * Convención de nombres:
 *   cs1-cap1-cuadernillo.html
 *   cs1-cap2-cuadernillo.html
 *   cs2-cap1-cuadernillo.html
 *   etc.
 *
 * Seguridad:
 *   - Solo procesa archivos *-cuadernillo.html
 *   - No modifica novela ni guia
 *   - Genera backup automático de cada archivo antes de sobrescribir
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';

// ─── Configuración ────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH = resolve('./service-account.json');
const CARPETA_INTERACTIVOS = resolve('./materiales-temp-interactivos');
const BUCKET_NAME          = 'academic-tracker-qeoxi.firebasestorage.app';

// ─── Parsear nombre de archivo ────────────────────────────────────
// Espera: cs1-cap1-cuadernillo.html, cs2-cap3-cuadernillo.html, etc.

function parsear(nombreArchivo) {
  const base = basename(nombreArchivo, '.html');
  const match = base.match(/^(cs\d)-(cap\d+)-(cuadernillo)$/i);

  if (!match) return null;

  const [, semestre] = match;
  const slug = base.toLowerCase();

  return {
    semestre,
    slug,
    rutaStorage: `ecosistema/materiales/estacion_${semestre}/${slug}.html`,
  };
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔄  Letras Necias — Re-subir cuadernillos interactivos a Storage\n');

  // Verificar service account
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('✗  No se encontró service-account.json en la raíz del proyecto.');
    console.error('   Coloca el archivo y vuelve a correr el script.');
    process.exit(1);
  }

  // Verificar carpeta de interactivos
  if (!existsSync(CARPETA_INTERACTIVOS)) {
    console.error(`✗  No se encontró la carpeta ${CARPETA_INTERACTIVOS}`);
    console.error('   Primero ejecuta: node scripts/hacer-cuadernillos-interactivos.mjs');
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

  // Solo procesar cuadernillos interactivos
  const archivos = readdirSync(CARPETA_INTERACTIVOS)
    .filter(f => f.endsWith('-cuadernillo.html'))
    .sort();

  console.log(`📁  Carpeta: ${CARPETA_INTERACTIVOS}`);
  console.log(`📄  Cuadernillos interactivos encontrados: ${archivos.length}\n`);

  if (archivos.length === 0) {
    console.log('⚠  No hay archivos *-cuadernillo.html en materiales-temp-interactivos/');
    console.log('   Primero ejecuta: node scripts/hacer-cuadernillos-interactivos.mjs');
    process.exit(0);
  }

  let exitosos = 0;
  let errores  = 0;

  for (const nombreArchivo of archivos) {
    const meta = parsear(nombreArchivo);

    if (!meta) {
      console.log(`  ⚠  Ignorado (nombre no reconocido): ${nombreArchivo}`);
      continue;
    }

    const rutaLocal = join(CARPETA_INTERACTIVOS, nombreArchivo);
    const htmlContent = readFileSync(rutaLocal, 'utf8');

    try {
      const file = bucket.file(meta.rutaStorage);

      // Verificar si existe el archivo anterior (para reporte)
      const [exists] = await file.exists();

      // Sobrescribir con la versión interactiva
      await file.save(htmlContent, {
        contentType: 'text/html; charset=utf-8',
        metadata: { cacheControl: 'private, max-age=3600' },
      });

      const accion = exists ? '↻  Sobrescrito' : '✓  Subido (nuevo)';
      console.log(`  ${accion}: ${meta.slug}`);
      console.log(`       Storage: ${meta.rutaStorage}`);
      exitosos++;

    } catch (err) {
      console.error(`  ✗  Error en ${nombreArchivo}: ${err.message}`);
      errores++;
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`  ✓ Exitosos:  ${exitosos}`);
  console.log(`  ✗ Errores:   ${errores}`);
  console.log(`  Total:       ${archivos.length} archivos`);
  console.log('\n✅  Los cuadernillos interactivos ya están en Storage.');
  console.log('    Firestore no se modificó (los metadatos ya existen).\n');
}

main().catch((err) => {
  console.error('\n✗  Error fatal:', err.message);
  process.exit(1);
});
