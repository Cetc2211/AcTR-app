/**
 * Test Script para Cloud Run + AI Integration
 * Este script prueba la conexión con el backend de IA en Cloud Run
 * 
 * Uso: node test-ai-integration.js
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuración
const config = {
  backendUrl: process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT || 'https://backend-service-263108580734.us-central1.run.app',
  projectId: process.env.GCP_PROJECT_ID || 'actracker-master',
  region: process.env.GCP_REGION || 'us-central1'
};

console.log(`${colors.blue}================================${colors.reset}`);
console.log(`${colors.blue}🧪 TESTING: Cloud Run + AI Integration${colors.reset}`);
console.log(`${colors.blue}================================${colors.reset}`);
console.log('');

// Helper functions
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`);
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

// Test 1: Verificar variables de entorno
async function testEnvironmentVariables() {
  console.log(`${colors.blue}[TEST 1]${colors.reset} Verificando variables de entorno...`);
  
  const envFile = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envFile)) {
    success('.env.local existe');
    const content = fs.readFileSync(envFile, 'utf-8');
    
    if (content.includes('NEXT_PUBLIC_CLOUD_RUN_ENDPOINT')) {
      success('NEXT_PUBLIC_CLOUD_RUN_ENDPOINT está configurado');
    } else {
      warning('NEXT_PUBLIC_CLOUD_RUN_ENDPOINT NO está en .env.local');
    }
  } else {
    warning('.env.local no existe');
  }
  
  info(`Backend URL: ${config.backendUrl}`);
  info(`Project ID: ${config.projectId}`);
  info(`Region: ${config.region}`);
  console.log('');
}

// Test 2: Health Check
async function testHealthCheck() {
  console.log(`${colors.blue}[TEST 2]${colors.reset} Probando Health Check...`);
  console.log(`  URL: ${config.backendUrl}/`);
  console.log(`  Método: GET`);
  console.log('');
  
  try {
    const response = await fetch(`${config.backendUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      success('Health Check EXITOSO');
      console.log('  Respuesta:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      warning(`Status: ${response.status}`);
      console.log('  Respuesta:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    error(`Health Check FALLÓ: ${err.message}`);
    warning('Verifica que:');
    console.log('  1. Cloud Run service está RUNNING');
    console.log('  2. La URL es correcta: ' + config.backendUrl);
    console.log('  3. Tienes conexión a internet');
  }
  console.log('');
}

// Test 3: Generate Student Feedback
async function testGenerateStudentFeedback() {
  console.log(`${colors.blue}[TEST 3]${colors.reset} Probando generación de retroalimentación...`);
  console.log(`  URL: ${config.backendUrl}/generate-report`);
  console.log(`  Método: POST`);
  console.log('');
  
  const payload = {
    student_name: 'Juan Pérez García',
    subject: 'Evaluación del Primer Parcial',
    grades: `
      Calificación Final: 85.5/100.
      Asistencia: 92.0%.
      Mejores criterios: Participación, Trabajos prácticos.
      Criterios a mejorar: Pruebas escritas, Puntualidad.
      Observaciones: Buen desempeño en general; necesita mejorar en evaluaciones.
    `
  };
  
  console.log('  Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  console.log('  Enviando solicitud...');
  console.log('');
  
  try {
    const response = await fetch(`${config.backendUrl}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.report) {
      success('Generación de retroalimentación EXITOSA');
      console.log('');
      console.log('  Retroalimentación generada:');
      console.log('  ' + colors.cyan + data.report + colors.reset);
    } else {
      warning(`Status: ${response.status}`);
      console.log('  Respuesta:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    error(`Generación FALLÓ: ${err.message}`);
    warning('Verifica que:');
    console.log('  1. El health check funciona primero');
    console.log('  2. Vertex AI está habilitado en GCP');
    console.log('  3. Tienes cuota disponible');
  }
  console.log('');
}

// Test 4: Generate Group Report
async function testGenerateGroupReport() {
  console.log(`${colors.blue}[TEST 4]${colors.reset} Probando generación de análisis de grupo...`);
  console.log(`  URL: ${config.backendUrl}/generate-group-report`);
  console.log(`  Método: POST`);
  console.log('');
  
  const payload = {
    group_name: 'Matemáticas 10A',
    partial: 'Primer Parcial',
    stats: {
      totalStudents: 30,
      approvedCount: 25,
      failedCount: 5,
      groupAverage: '78.5',
      attendanceRate: '88.3',
      atRiskStudentCount: 3
    }
  };
  
  console.log('  Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  console.log('  Enviando solicitud...');
  console.log('');
  
  try {
    const response = await fetch(`${config.backendUrl}/generate-group-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.report) {
      success('Generación de análisis EXITOSA');
      console.log('');
      console.log('  Análisis generado:');
      console.log('  ' + colors.cyan + data.report + colors.reset);
    } else {
      warning(`Status: ${response.status}`);
      console.log('  Respuesta:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    error(`Generación FALLÓ: ${err.message}`);
  }
  console.log('');
}

// Test 5: Check Network Connectivity
async function testNetworkConnectivity() {
  console.log(`${colors.blue}[TEST 5]${colors.reset} Verificando conectividad de red...`);
  
  try {
    const url = new URL(config.backendUrl);
    info(`Hostname: ${url.hostname}`);
    info(`Protocol: ${url.protocol}`);
    
    const response = await fetch(config.backendUrl, { method: 'HEAD' });
    success(`Red disponible (Status: ${response.status})`);
  } catch (err) {
    error(`Sin conectividad: ${err.message}`);
  }
  console.log('');
}

// Main test runner
async function runTests() {
  try {
    await testEnvironmentVariables();
    await testHealthCheck();
    await testGenerateStudentFeedback();
    await testGenerateGroupReport();
    await testNetworkConnectivity();
    
    console.log(`${colors.blue}================================${colors.reset}`);
    console.log(`${colors.blue}📊 RESUMEN${colors.reset}`);
    console.log(`${colors.blue}================================${colors.reset}`);
    console.log('');
    console.log(`${colors.green}✓ Tests completados${colors.reset}`);
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Verifica los resultados arriba');
    console.log('2. Si hay errores, consulta SETUP_CLOUD_RUN.md');
    console.log('3. Prueba generando informes en la aplicación');
    console.log('');
  } catch (err) {
    console.error('Error fatal:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testHealthCheck, testGenerateStudentFeedback, testGenerateGroupReport };
