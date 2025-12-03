'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, XCircle, Zap } from 'lucide-react';

export default function TestAIPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/test-ai', { method: 'GET' });
      const testResults = await response.json();
      setResults(testResults);
    } catch (error: any) {
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-blue-600" />
          Test de Integración - Cloud Run + IA
        </h1>
        <p className="text-muted-foreground mt-2">
          Verifica la conexión con Google Cloud y la capacidad de generar informes con IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Pruebas</CardTitle>
          <CardDescription>
            Haz clic en el botón para realizar todas las pruebas de integración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleRunTests} 
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? 'Ejecutando pruebas...' : 'Iniciar Pruebas'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          {results.error ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Error</CardTitle>
              </CardHeader>
              <CardContent className="text-red-800">
                {results.error}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{results.summary?.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Exitosas</p>
                      <p className="text-2xl font-bold text-green-600">{results.summary?.passed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fallos</p>
                      <p className="text-2xl font-bold text-red-600">{results.summary?.failed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Errores</p>
                      <p className="text-2xl font-bold text-yellow-600">{results.summary?.errors}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {results.summary?.allPassed ? (
                      <Badge className="bg-green-600">✓ Todas las pruebas pasaron</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Algunas pruebas fallaron</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalles de Pruebas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.tests?.map((test: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <h3 className="font-semibold">{test.name}</h3>
                          </div>
                          <Badge className={getStatusColor(test.status)}>
                            {test.status}
                          </Badge>
                        </div>
                        
                        {test.code && (
                          <p className="text-sm text-muted-foreground">
                            Status Code: <code className="bg-muted px-2 py-1 rounded">{test.code}</code>
                          </p>
                        )}
                        
                        {test.error && (
                          <p className="text-sm text-red-600 mt-2">
                            Error: {test.error}
                          </p>
                        )}
                        
                        {test.data && (
                          <div className="mt-3 bg-muted p-3 rounded text-sm">
                            <pre className="overflow-x-auto">
                              {JSON.stringify(test.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {test.reportPreview && (
                          <div className="mt-3 bg-muted p-3 rounded text-sm">
                            <p className="font-semibold mb-1">Reportaje generado:</p>
                            <p className="text-muted-foreground italic">
                              {test.reportPreview}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              (Longitud total: {test.reportLength} caracteres)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Información</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900">
                  <p>
                    Pruebas ejecutadas: <code className="bg-white px-2 py-1 rounded">{results.timestamp}</code>
                  </p>
                  {results.summary?.allPassed && (
                    <p className="mt-2">
                      ✓ La integración está funcionando correctamente. Puedes generar informes desde:
                      <ul className="list-disc list-inside mt-2 ml-2">
                        <li>Página de Estudiantes</li>
                        <li>Página de Reportes</li>
                      </ul>
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
