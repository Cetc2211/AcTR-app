#!/usr/bin/env node

/**
 * scripts/hacer-cuadernillos-interactivos.mjs
 *
 * Transforma los cuadernillos CS (no interactivos) en interactivos,
 * siguiendo el mismo patrón que los cuadernillos PFH1.
 *
 * Cambios que hace:
 *   1. Reemplaza <div class="lineas"> con <textarea> interactivo
 *   2. Hace editables las celdas vacías de tablas (height:2cm)
 *   3. Agrega <input> en los campos de la ficha del estudiante
 *   4. Agrega CSS para textareas y inputs interactivos
 *   5. Agrega JavaScript de guardar/cargar/autoguardado con localStorage
 *
 * Seguridad:
 *   - Solo modifica archivos *-cuadernillo.html
 *   - No modifica novela ni guia
 *   - Genera los archivos transformados en materiales-temp-interactivos/
 *   - Los archivos originales NO se tocan
 *
 * Uso:
 *   1. Coloca los HTML originales en materiales-temp/
 *   2. node scripts/hacer-cuadernillos-interactivos.mjs
 *   3. Revisa los archivos generados en materiales-temp-interactivos/
 *   4. Si están correctos, sube con el script de subida
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, basename } from 'path';

const CARPETA_ORIGEN  = resolve('./materiales-temp');
const CARPETA_DESTINO = resolve('./materiales-temp-interactivos');

// ─── CSS interactivo a inyectar ──────────────────────────────────

const CSS_INTERACTIVO = `
/* ── INTERACTIVO: campos editables ── */
.raiz-digital textarea.rd-respuesta {
  width: 100%;
  border: 1pt solid #8080c0;
  border-radius: 2px;
  background: rgba(255,255,255,0.85);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  line-height: 1.65;
  color: #0e0a1e;
  padding: .3rem .5rem;
  resize: vertical;
  min-height: 2.5rem;
  outline: none;
  transition: border-color .2s, background .2s;
}
.raiz-digital textarea.rd-respuesta:focus {
  border-color: #1a1060;
  background: #fff;
}
.raiz-digital textarea.rd-respuesta.rd-alta { min-height: 5rem; }
.raiz-digital textarea.rd-respuesta.rd-muy-alta { min-height: 7rem; }

.raiz-digital td[contenteditable="true"] {
  outline: 1pt dashed #8080c0;
  cursor: text;
  background: rgba(255,255,255,0.6);
}
.raiz-digital td[contenteditable="true"]:focus {
  outline: 1pt solid #1a1060;
  background: #fff;
}

.raiz-digital .ficha-est input.rd-input {
  width: 100%;
  border: none;
  border-bottom: 1pt solid #6060a8;
  background: transparent;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  color: #0e0a1e;
  padding: .15rem 0;
  outline: none;
}
.raiz-digital .ficha-est input.rd-input:focus {
  border-bottom-color: #1a1060;
}

.raiz-digital .rd-guardar {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
  border-top: 1pt solid #8080c0;
  background: #f0eef8;
}
.raiz-digital .rd-btn-guardar {
  background: #1a1060;
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 8pt;
  letter-spacing: .15em;
  text-transform: uppercase;
  padding: .5rem 1.5rem;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  transition: background .2s;
}
.raiz-digital .rd-btn-guardar:hover { background: #0e0a1e; }
.raiz-digital .rd-btn-limpiar {
  background: transparent;
  color: #6060a8;
  font-family: Arial, sans-serif;
  font-size: 7.5pt;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: .4rem .8rem;
  border: 1pt solid #8080c0;
  cursor: pointer;
  margin-left: .5rem;
  border-radius: 3px;
}
.raiz-digital .rd-aviso {
  font-size: 7.5pt;
  color: #6060a8;
  margin-top: .4rem;
  display: block;
}
`;

// ─── Funciones de transformación ─────────────────────────────────

/**
 * Reemplaza <div class="lineas">...</div> con <textarea>
 * dentro de <div class="espacio-respuesta">
 */
function reemplazarLineas(html) {
  // Patrón: <div class="lineas"><div class="linea"></div>...(repetido)...</div>
  // seguido de </div> que cierra espacio-respuesta
  // Usamos un patrón greedy específico para .linea que evita ambigüedad con </div>
  return html.replace(
    /<div class="espacio-respuesta">([\s\S]*?)<div class="lineas">((?:<div class="linea"><\/div>\s*)+)<\/div>\s*<\/div>/g,
    (match, antes, lineasContent) => {
      const numLineas = (lineasContent.match(/<div class="linea"><\/div>/g) || []).length;
      let claseAltura = '';
      if (numLineas >= 5) claseAltura = ' rd-muy-alta';
      else if (numLineas >= 3) claseAltura = ' rd-alta';

      const id = 'rd_' + Math.random().toString(36).substring(2, 8);

      return `<div class="espacio-respuesta">${antes}<textarea class="rd-respuesta${claseAltura}" id="${id}" placeholder="Escribe tu respuesta aquí..."></textarea>\n    </div>`;
    }
  );
}

/**
 * Hace editables las celdas vacías de tablas con height:2cm
 */
function hacerCeldasEditables(html) {
  return html.replace(
    /<td style="height:2cm;\s*"><\/td>/g,
    '<td contenteditable="true" style="height:2cm;min-height:2cm;"></td>'
  );
}

/**
 * Agrega inputs en la ficha del estudiante
 */
function agregarInputsFicha(html) {
  // Patrón: <div class="campo"><strong>Nombre completo</strong></div>
  // Agregar un input después del strong
  return html.replace(
    /<div class="campo"><strong>([^<]+)<\/strong><\/div>/g,
    (match, label) => {
      const id = 'rd_ficha_' + label.toLowerCase().replace(/[^a-záéíóúñü]/gi, '_').substring(0, 20);
      return `<div class="campo"><strong>${label}</strong><input type="text" class="rd-input" id="${id}" placeholder=""></div>`;
    }
  );
}

/**
 * Inyecta CSS interactivo antes de </style>
 */
function inyectarCSS(html) {
  return html.replace(
    /<\/style>/,
    CSS_INTERACTIVO + '\n</style>'
  );
}

/**
 * Genera el script JS de guardar/cargar y lo inyecta antes de </body>
 */
function inyectarScript(html, fileName) {
  // Generar clave única por archivo
  const baseName = basename(fileName, '.html').replace(/[^a-z0-9_]/gi, '_');
  const CLAVE = `rd_${baseName}_`;

  const script = `
<script>
(function(){
  const CLAVE='${CLAVE}';
  const CAMPOS=[];
  const EDITABLES=[];

  // Recopilar textareas e inputs con id que empiece con rd_
  document.querySelectorAll('textarea.rd-respuesta, input.rd-input').forEach(function(el){
    if(el.id) CAMPOS.push(el.id);
  });

  // Recopilar celdas contenteditable
  document.querySelectorAll('td[contenteditable="true"]').forEach(function(el,i){
    el.id=el.id||('rd_cell_'+i);
    EDITABLES.push(el.id);
  });

  function cargar(){
    CAMPOS.forEach(function(id){
      var el=document.getElementById(id);
      var v=localStorage.getItem(CLAVE+id);
      if(el&&v){el.value=v;}
    });
    EDITABLES.forEach(function(id){
      var el=document.getElementById(id);
      var v=localStorage.getItem(CLAVE+id);
      if(el&&v){el.textContent=v;}
    });
  }

  function guardar(){
    CAMPOS.forEach(function(id){
      var el=document.getElementById(id);
      if(el) localStorage.setItem(CLAVE+id,el.value);
    });
    EDITABLES.forEach(function(id){
      var el=document.getElementById(id);
      if(el) localStorage.setItem(CLAVE+id,el.textContent);
    });
    var av=document.getElementById('rd-aviso');
    if(av){av.textContent='✓ Respuestas guardadas en este dispositivo';setTimeout(function(){av.textContent='';},3000);}
  }

  function limpiar(){
    if(!confirm('¿Borrar todas las respuestas? Esta acción no se puede deshacer.'))return;
    CAMPOS.forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    EDITABLES.forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='';});
    CAMPOS.forEach(function(id){localStorage.removeItem(CLAVE+id);});
    EDITABLES.forEach(function(id){localStorage.removeItem(CLAVE+id);});
  }

  window.addEventListener('load',cargar);
  setInterval(guardar,30000);

  // Exponer funciones globalmente para los botones
  window.rd_guardar=guardar;
  window.rd_limpiar=limpiar;
})();
</script>`;

  return html.replace(
    /<\/body>/,
    script + '\n</body>'
  );
}

/**
 * Agrega barra de guardar antes del footer
 */
function agregarBarraGuardar(html) {
  const barra = `
<div class="rd-guardar">
  <button class="rd-btn-guardar" onclick="rd_guardar()">↓ Guardar mis respuestas</button>
  <button class="rd-btn-limpiar" onclick="rd_limpiar()">Borrar todo</button>
  <span class="rd-aviso" id="rd-aviso"></span>
</div>`;

  // Insertar antes del footer ln-firma
  return html.replace(
    /(<footer class="ln-firma">)/,
    barra + '\n$1'
  );
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('\n📝  Letras Necias — Hacer cuadernillos interactivos\n');

  if (!existsSync(CARPETA_ORIGEN)) {
    console.error(`✗  No se encontró la carpeta ${CARPETA_ORIGEN}`);
    console.error('   Coloca los archivos HTML originales ahí.');
    process.exit(1);
  }

  // Crear carpeta destino
  if (!existsSync(CARPETA_DESTINO)) {
    mkdirSync(CARPETA_DESTINO, { recursive: true });
  }

  // Solo procesar cuadernillos
  const archivos = readdirSync(CARPETA_ORIGEN)
    .filter(f => f.endsWith('-cuadernillo.html'))
    .sort();

  console.log(`📁  Carpeta origen:  ${CARPETA_ORIGEN}`);
  console.log(`📁  Carpeta destino: ${CARPETA_DESTINO}`);
  console.log(`📄  Cuadernillos encontrados: ${archivos.length}\n`);

  if (archivos.length === 0) {
    console.log('⚠  No hay archivos *-cuadernillo.html en materiales-temp/');
    process.exit(0);
  }

  let procesados = 0;
  let errores = 0;

  for (const nombreArchivo of archivos) {
    const rutaOrigen  = join(CARPETA_ORIGEN, nombreArchivo);
    const rutaDestino = join(CARPETA_DESTINO, nombreArchivo);

    try {
      let html = readFileSync(rutaOrigen, 'utf8');

      // Aplicar transformaciones en orden
      const original = html;

      html = reemplazarLineas(html);
      html = hacerCeldasEditables(html);
      html = agregarInputsFicha(html);
      html = inyectarCSS(html);
      html = agregarBarraGuardar(html);
      html = inyectarScript(html, nombreArchivo);

      // Verificar que algo cambió
      if (html === original) {
        console.log(`  ⚠  Sin cambios: ${nombreArchivo} (¿ya es interactivo o no tiene áreas de respuesta?)`);
      } else {
        writeFileSync(rutaDestino, html, 'utf8');
        console.log(`  ✓  ${nombreArchivo}`);

        // Reporte de cambios
        const numTextareas = (html.match(/class="rd-respuesta/g) || []).length;
        const numEditables = (html.match(/contenteditable="true"/g) || []).length;
        const numInputs    = (html.match(/class="rd-input/g) || []).length;
        console.log(`       Textareas: ${numTextareas} · Celdas editables: ${numEditables} · Inputs ficha: ${numInputs}`);
        procesados++;
      }

    } catch (err) {
      console.error(`  ✗  Error en ${nombreArchivo}: ${err.message}`);
      errores++;
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`  ✓ Procesados:  ${procesados}`);
  console.log(`  ✗ Errores:     ${errores}`);
  console.log(`  Total:         ${archivos.length} archivos`);
  console.log(`\n📁  Archivos generados en: ${CARPETA_DESTINO}`);
  console.log('\n⚠  REVISION REQUERIDA: Abre los archivos generados en un navegador');
  console.log('    y verifica que las áreas interactivas funcionan correctamente');
  console.log('    antes de subirlos a Firebase Storage.\n');
}

main().catch((err) => {
  console.error('\n✗  Error fatal:', err.message);
  process.exit(1);
});
