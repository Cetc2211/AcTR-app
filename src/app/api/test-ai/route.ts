/**
 * API Route para testing de Cloud Run + IA Integration
 * Endpoint: GET /api/test-ai
 * Nota: Esta ruta se ejecuta bajo demanda (serverless), no durante el build
 */

// Configuración de runtime para Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Timeout interno para fetch (10 segundos por request)
const FETCH_TIMEOUT = 10000;

// Función helper para hacer fetch con timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    note: 'API Route ejecutada bajo demanda (no durante build)'
  };

  const backendUrl = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT || 'https://ai-report-service-jjaeoswhya-uc.a.run.app';

  // Test 1: Health Check
  try {
    const response = await fetchWithTimeout(`${backendUrl}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }, 5000); // 5 segundos para health check
    
    const data = await response.json();
    
    results.tests.push({
      name: 'Health Check',
      status: response.ok && data.status === 'healthy' ? 'PASS' : 'FAIL',
      code: response.status,
      data: data
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Health Check',
      status: 'ERROR',
      error: err.message
    });
  }

  // Test 2: Generate Student Feedback
  try {
    const payload = {
      student_name: 'Test Student',
      subject: 'Evaluación del Primer Parcial',
      grades: `
        Calificación Final: 85.5/100.
        Asistencia: 92.0%.
        Mejores criterios: Participación, Trabajos prácticos.
        Criterios a mejorar: Pruebas escritas, Puntualidad.
        Observaciones: Buen desempeño en general; necesita mejorar en evaluaciones.
      `
    };

    const response = await fetchWithTimeout(`${backendUrl}/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 15000); // 15 segundos para generación de reporte
    
    const data = await response.json();
    
    results.tests.push({
      name: 'Generate Student Feedback',
      status: response.ok && data.report ? 'PASS' : 'FAIL',
      code: response.status,
      reportLength: data.report ? data.report.length : 0,
      reportPreview: data.report ? data.report.substring(0, 100) + '...' : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Generate Student Feedback',
      status: 'ERROR',
      error: err.message
    });
  }

  // Test 3: Generate Group Report
  try {
    const payload = {
      group_name: 'Test Group',
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

    const response = await fetchWithTimeout(`${backendUrl}/generate-group-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 15000); // 15 segundos para generación de reporte
    
    const data = await response.json();
    
    results.tests.push({
      name: 'Generate Group Report',
      status: response.ok && data.report ? 'PASS' : 'FAIL',
      code: response.status,
      reportLength: data.report ? data.report.length : 0,
      reportPreview: data.report ? data.report.substring(0, 100) + '...' : null
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Generate Group Report',
      status: 'ERROR',
      error: err.message
    });
  }

  // Summary
  const passed = results.tests.filter((t: any) => t.status === 'PASS').length;
  const failed = results.tests.filter((t: any) => t.status === 'FAIL').length;
  const errors = results.tests.filter((t: any) => t.status === 'ERROR').length;

  results.summary = {
    total: results.tests.length,
    passed,
    failed,
    errors,
    allPassed: failed === 0 && errors === 0
  };

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
