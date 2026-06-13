/**
 * convertir-cuadernillos-interactivos.mjs
 * 
 * Convierte los cuadernillos CS (cs1/cs2/cs3) de estáticos a interactivos.
 * Lee de: materiales-temp/cs{N}-cap{N}-cuadernillo.html
 * Escribe en: materiales-temp-interactivos/cs{N}-cap{N}-cuadernillo.html
 * 
 * Uso: node convertir-cuadernillos-interactivos.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');

const ORIGEN = path.join(RAIZ, 'materiales-temp');
const DESTINO = path.join(RAIZ, 'materiales-temp-interactivos');

// ── Crear carpeta destino si no existe ─────────────────────────
if (!fs.existsSync(DESTINO)) {
  fs.mkdirSync(DESTINO, { recursive: true });
  console.log(`✓ Carpeta creada: ${DESTINO}`);
}

// ── Listar cuadernillos CS ──────────────────────────────────────
const archivos = fs.readdirSync(ORIGEN).filter(f =>
  f.match(/^cs[123]-cap\d+-cuadernillo\.html$/)
);

if (archivos.length === 0) {
  console.error('✗ No se encontraron archivos cuadernillo en materiales-temp/');
  process.exit(1);
}

console.log(`\nProcesando ${archivos.length} cuadernillos...\n`);

let ok = 0;
let errores = 0;

for (const archivo of archivos) {
  try {
    const origen = path.join(ORIGEN, archivo);
    const destino = path.join(DESTINO, archivo);
    let html = fs.readFileSync(origen, 'utf-8');

    // Extraer clave única del archivo (ej: cs1_cap3)
    const match = archivo.match(/^(cs[123])-(cap\d+)-cuadernillo\.html$/);
    const claveBase = match ? `${match[1]}_${match[2]}` : archivo.replace('.html','').replace(/-/g,'_');
    const CLAVE = `cuad_${claveBase}_`;

    // ── 1. Convertir líneas de espacio (spans/divs vacíos para escribir) ──────
    // Patrón: elementos con clase que sugiere espacio de escritura
    html = html.replace(
      /<(div|span)\s+class="[^"]*(?:espacio|linea|respuesta|write|answer|blank)[^"]*"[^>]*>\s*<\/\1>/gi,
      (match, tag) => `<textarea class="cuad-r" placeholder="Escribe aquí..."></textarea>`
    );

    // ── 2. Convertir inputs de texto que sean campos de respuesta ─────────────
    html = html.replace(
      /<input\s+type="text"([^>]*)>/gi,
      (match, attrs) => {
        if (attrs.includes('id="nombre"') || attrs.includes('id="grupo"') || attrs.includes('id="docente"')) {
          return match; // Mantener campos de datos del estudiante como están
        }
        return `<textarea class="cuad-r" placeholder="Escribe aquí..."${attrs}></textarea>`;
      }
    );

    // ── 3. Insertar CSS interactivo antes del cierre de </style> ──────────────
    const cssInteractivo = `
/* ── INTERACTIVIDAD DIGITAL ─────────────────────────────── */
textarea.cuad-r {
  width: 100%;
  border: 1px solid rgba(42,32,16,0.18);
  border-radius: 3px;
  background: rgba(255,255,255,0.7);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #1a1208;
  padding: 0.55rem 0.8rem;
  resize: vertical;
  min-height: 4rem;
  outline: none;
  transition: border-color .2s, background .2s;
  display: block;
  box-sizing: border-box;
}
textarea.cuad-r:focus {
  border-color: var(--cs-acento, #4a2e10);
  background: #fff;
}
textarea.cuad-r.grande { min-height: 6rem; }
textarea.cuad-r.xgrande { min-height: 8rem; }

.cuad-guardar-barra {
  text-align: center;
  padding: 1.2rem;
  background: var(--crema, #f5ead8);
  border-top: 1px solid rgba(42,32,16,0.1);
  position: sticky;
  bottom: 0;
}
.cuad-btn-guardar {
  background: var(--cs-acento, #4a2e10);
  color: #fff;
  font-family: monospace;
  font-size: .5rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  padding: .65rem 1.8rem;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  transition: background .2s;
}
.cuad-btn-guardar:hover { filter: brightness(1.15); }
.cuad-btn-limpiar {
  background: transparent;
  color: #888;
  font-family: monospace;
  font-size: .44rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  padding: .5rem 1rem;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 3px;
  margin-left: .6rem;
}
.cuad-aviso {
  font-family: monospace;
  font-size: .4rem;
  color: #666;
  margin-top: .5rem;
  display: block;
}
@media print {
  textarea.cuad-r {
    border: none;
    border-bottom: 1px solid #999;
    border-radius: 0;
    background: transparent;
    resize: none;
    min-height: 2rem;
  }
  .cuad-guardar-barra { display: none; }
}
`;

    if (html.includes('</style>')) {
      html = html.replace('</style>', cssInteractivo + '\n</style>');
    } else {
      // Si no hay </style>, insertar bloque completo antes del cierre de </head>
      html = html.replace('</head>', `<style>${cssInteractivo}</style>\n</head>`);
    }

    // ── 4. Agregar IDs a textareas sin id para el guardado ───────────────────
    let contador = 0;
    html = html.replace(/<textarea\s+class="cuad-r"([^>]*)>/gi, (match, attrs) => {
      if (attrs.includes('id=')) return match;
      contador++;
      return `<textarea class="cuad-r" id="r${contador}"${attrs}>`;
    });

    // ── 5. Insertar barra de guardar + script antes de </body> ───────────────
    const scriptGuardado = `
<!-- BARRA GUARDAR -->
<div class="cuad-guardar-barra">
  <button class="cuad-btn-guardar" onclick="cuadGuardar()">↓ Guardar mis respuestas</button>
  <button class="cuad-btn-limpiar" onclick="cuadLimpiar()">Borrar todo</button>
  <span class="cuad-aviso" id="cuad-aviso"></span>
</div>

<script>
(function() {
  var CLAVE = '${CLAVE}';

  function cuadGuardar() {
    document.querySelectorAll('textarea.cuad-r').forEach(function(el) {
      if (el.id) localStorage.setItem(CLAVE + el.id, el.value);
    });
    document.querySelectorAll('input[type="text"]').forEach(function(el) {
      if (el.id) localStorage.setItem(CLAVE + el.id, el.value);
    });
    var av = document.getElementById('cuad-aviso');
    if (av) { av.textContent = '✓ Respuestas guardadas en este dispositivo'; setTimeout(function(){ av.textContent=''; }, 3000); }
  }

  function cuadLimpiar() {
    if (!confirm('¿Borrar todas las respuestas de este cuadernillo?')) return;
    document.querySelectorAll('textarea.cuad-r').forEach(function(el) {
      el.value = '';
      if (el.id) localStorage.removeItem(CLAVE + el.id);
    });
    document.querySelectorAll('input[type="text"]').forEach(function(el) {
      el.value = '';
      if (el.id) localStorage.removeItem(CLAVE + el.id);
    });
  }

  function cuadCargar() {
    document.querySelectorAll('textarea.cuad-r').forEach(function(el) {
      if (el.id) { var v = localStorage.getItem(CLAVE + el.id); if (v) el.value = v; }
    });
    document.querySelectorAll('input[type="text"]').forEach(function(el) {
      if (el.id) { var v = localStorage.getItem(CLAVE + el.id); if (v) el.value = v; }
    });
  }

  window.cuadGuardar = cuadGuardar;
  window.cuadLimpiar = cuadLimpiar;
  window.addEventListener('load', cuadCargar);
  setInterval(cuadGuardar, 30000);
})();
</script>
`;

    html = html.replace('</body>', scriptGuardado + '\n</body>');

    // ── 6. Escribir archivo destino ──────────────────────────────────────────
    fs.writeFileSync(destino, html, 'utf-8');
    console.log(`  ✓ ${archivo}`);
    ok++;

  } catch (err) {
    console.error(`  ✗ ${archivo}: ${err.message}`);
    errores++;
  }
}

console.log(`\n─────────────────────────────────────`);
console.log(`✅ ${ok} cuadernillos convertidos`);
if (errores > 0) console.log(`⚠  ${errores} errores`);
console.log(`Destino: materiales-temp-interactivos/`);
