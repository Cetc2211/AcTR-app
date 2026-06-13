/**
 * convertir-cuadernillos-interactivos.mjs
 * Lee de:    materiales-temp/cs{N}-cap{N}-cuadernillo.html
 * Escribe en: materiales-temp-interactivos/cs{N}-cap{N}-cuadernillo.html
 * Uso: node convertir-cuadernillos-interactivos.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGEN  = path.join(__dirname, 'materiales-temp');
const DESTINO = path.join(__dirname, 'materiales-temp-interactivos');

if (!fs.existsSync(DESTINO)) {
  fs.mkdirSync(DESTINO, { recursive: true });
  console.log(`✓ Carpeta creada: materiales-temp-interactivos/`);
}

const archivos = fs.readdirSync(ORIGEN).filter(f =>
  f.match(/^cs[123]-cap\d+-cuadernillo\.html$/)
);

if (archivos.length === 0) {
  console.error('✗ No se encontraron archivos cuadernillo en materiales-temp/');
  process.exit(1);
}

console.log(`\nProcesando ${archivos.length} cuadernillos...\n`);

let ok = 0;

for (const archivo of archivos) {
  try {
    const match = archivo.match(/^(cs[123])-(cap\d+)-cuadernillo\.html$/);
    const CLAVE = `cuad_${match[1]}_${match[2]}_`;

    let html = fs.readFileSync(path.join(ORIGEN, archivo), 'utf-8');

    // ── 1. Convertir .linea (spans/divs vacíos de líneas de escritura) ──────
    // El patrón del ecosistema CS usa <div class="linea"></div> dentro de .lineas
    html = html.replace(/<div class="linea"><\/div>/gi,
      `<textarea class="cuad-r" placeholder="Escribe aquí..."></textarea>`
    );

    // ── 2. Convertir celdas <td> editables ──────────────────────────────────
    // Las celdas que tienen style="height:Xcm;" están pensadas para escribir
    // Agrega un textarea dentro sin eliminar el td
    html = html.replace(
      /(<td[^>]*style="[^"]*height:\s*[\d.]+cm[^"]*"[^>]*>)([\s\S]*?)(<\/td>)/gi,
      (match, open, inner, close) => {
        // Si ya tiene textarea, no duplicar
        if (inner.includes('<textarea')) return match;
        // Limpiar contenido vacío y agregar textarea
        const contenidoLimpio = inner.trim();
        return `${open}${contenidoLimpio}<textarea class="cuad-r td-r" placeholder="Escribe aquí..."></textarea>${close}`;
      }
    );

    // ── 3. Celdas <td> vacías sin style height (tablas de criterios, etc.) ──
    html = html.replace(
      /(<td(?![^>]*colspan)[^>]*>)(\s*)(<\/td>)/gi,
      (match, open, space, close) => {
        if (open.includes('cuad-r') || open.includes('textarea')) return match;
        return `${open}<textarea class="cuad-r td-r" placeholder="Escribe aquí..."></textarea>${close}`;
      }
    );

    // ── 4. CSS adicional para tablas + el CSS base ───────────────────────────
    const cssExtra = `
/* ── INTERACTIVIDAD DIGITAL ─────────────────────────────── */
textarea.cuad-r {
  width: 100%;
  border: 1px solid rgba(42,32,16,0.18);
  border-radius: 3px;
  background: rgba(255,255,255,0.7);
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.65;
  color: #1a1208;
  padding: 0.45rem 0.7rem;
  resize: vertical;
  min-height: 3.5rem;
  outline: none;
  transition: border-color .2s, background .2s;
  display: block;
  box-sizing: border-box;
  margin-top: 0.2rem;
}
textarea.cuad-r:focus {
  border-color: #5c3a1e;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(92,58,30,0.08);
}
/* Textarea dentro de celda de tabla */
textarea.cuad-r.td-r {
  min-height: 5rem;
  border-radius: 2px;
  font-size: 0.82rem;
  background: rgba(255,255,255,0.85);
}
/* Eliminar height fijo de celdas ahora que tienen textarea */
.raiz-cs1 td[style*="height"] { height: auto !important; }

.cuad-guardar-barra {
  text-align: center;
  padding: 1rem 1.2rem;
  background: #f5ead8;
  border-top: 1px solid rgba(92,58,30,0.15);
  position: sticky;
  bottom: 0;
  z-index: 100;
}
.cuad-btn-guardar {
  background: #5c3a1e;
  color: #fff;
  font-family: monospace;
  font-size: .48rem;
  letter-spacing: .18em;
  text-transform: uppercase;
  padding: .6rem 1.8rem;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  transition: background .2s;
}
.cuad-btn-guardar:hover { background: #3d2210; }
.cuad-btn-limpiar {
  background: transparent;
  color: #888;
  font-family: monospace;
  font-size: .42rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: .5rem 1rem;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 3px;
  margin-left: .6rem;
}
.cuad-aviso {
  font-family: monospace;
  font-size: .38rem;
  color: #666;
  margin-top: .4rem;
  display: block;
}
@media print {
  textarea.cuad-r, textarea.cuad-r.td-r {
    border: none !important;
    border-bottom: 0.5pt solid #999 !important;
    border-radius: 0;
    background: transparent !important;
    resize: none;
    min-height: 1.5rem;
    box-shadow: none;
  }
  .cuad-guardar-barra { display: none !important; }
}
`;

    // Insertar CSS antes del </style>
    html = html.includes('</style>')
      ? html.replace('</style>', cssExtra + '\n</style>')
      : html.replace('</head>', `<style>${cssExtra}</style>\n</head>`);

    // ── 5. Asignar IDs únicos a textareas sin id ─────────────────────────────
    let contador = 0;
    html = html.replace(/<textarea\s+class="cuad-r([^"]*)"([^>]*)>/gi, (m, extra, attrs) => {
      if (attrs.includes('id=')) return m;
      contador++;
      return `<textarea class="cuad-r${extra}" id="r${contador}"${attrs}>`;
    });

    // ── 6. Barra guardar + script (solo si no existe ya) ────────────────────
    if (!html.includes('cuadGuardar')) {
      const script = `
<!-- BARRA GUARDAR -->
<div class="cuad-guardar-barra">
  <button class="cuad-btn-guardar" onclick="cuadGuardar()">↓ Guardar mis respuestas</button>
  <button class="cuad-btn-limpiar" onclick="cuadLimpiar()">Borrar todo</button>
  <span class="cuad-aviso" id="cuad-aviso"></span>
</div>
<script>
(function(){
  var C='${CLAVE}';
  function guardar(){
    document.querySelectorAll('textarea.cuad-r,input[type="text"]').forEach(function(el){
      if(el.id) localStorage.setItem(C+el.id,el.value);
    });
    var av=document.getElementById('cuad-aviso');
    if(av){av.textContent='✓ Respuestas guardadas';setTimeout(function(){av.textContent='';},3000);}
  }
  function limpiar(){
    if(!confirm('¿Borrar todas las respuestas?'))return;
    document.querySelectorAll('textarea.cuad-r,input[type="text"]').forEach(function(el){
      el.value='';if(el.id)localStorage.removeItem(C+el.id);
    });
  }
  function cargar(){
    document.querySelectorAll('textarea.cuad-r,input[type="text"]').forEach(function(el){
      if(el.id){var v=localStorage.getItem(C+el.id);if(v)el.value=v;}
    });
  }
  window.cuadGuardar=guardar;window.cuadLimpiar=limpiar;
  window.addEventListener('load',cargar);
  setInterval(guardar,30000);
})();
<\/script>`;
      html = html.replace('</body>', script + '\n</body>');
    }

    fs.writeFileSync(path.join(DESTINO, archivo), html, 'utf-8');
    console.log(`  ✓ ${archivo} (${contador} campos interactivos)`);
    ok++;

  } catch (err) {
    console.error(`  ✗ ${archivo}: ${err.message}`);
  }
}

console.log(`\n─────────────────────────────────────`);
console.log(`✅ ${ok} cuadernillos convertidos`);
console.log(`Destino: materiales-temp-interactivos/`);
