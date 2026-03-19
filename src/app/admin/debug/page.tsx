'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Play,
  Square,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Wifi,
  WifiOff,
  Database,
  Server,
  Clock,
} from 'lucide-react';
import { secureLogger, type LogEntry, type LogLevel } from '@/lib/secure-logger';
import { useAdmin } from '@/hooks/use-admin';
import { notFound } from 'next/navigation';

// Level colors and icons
const levelConfig: Record<LogLevel, { color: string; bgColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
  error: { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', Icon: AlertCircle },
  warn: { color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200', Icon: AlertTriangle },
  info: { color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', Icon: Info },
  debug: { color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', Icon: Bug },
};

// Filter button component
function FilterButton({ level, count, active, onClick }: { level: LogLevel; count: number; active: boolean; onClick: () => void }) {
  const config = levelConfig[level];
  const Icon = config.Icon;

  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-2 ${active ? '' : 'opacity-60'}`}
    >
      <Icon className="h-4 w-4" />
      <span className="capitalize">{level}</span>
      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
        {count}
      </Badge>
    </Button>
  );
}

// Single log entry component
function LogItem({ log, expanded, onToggle }: { log: LogEntry; expanded: boolean; onToggle: () => void }) {
  const config = levelConfig[log.level];
  const Icon = config.Icon;

  return (
    <div className={`border rounded-lg mb-2 ${config.bgColor}`}>
      <div
        className="p-3 cursor-pointer flex items-start gap-3"
        onClick={onToggle}
      >
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-mono">{log.timestamp.toLocaleTimeString()}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {log.level}
            </Badge>
          </div>
          <p className={`text-sm break-all ${config.color}`}>
            {log.message}
          </p>
        </div>
        {log.rawArgs && log.rawArgs !== '[]' && (
          expanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </div>
      {expanded && log.rawArgs && log.rawArgs !== '[]' && (
        <div className="px-3 pb-3 pt-0">
          <pre className="text-xs bg-white/50 p-2 rounded border overflow-x-auto max-h-60">
            {log.rawArgs}
          </pre>
        </div>
      )}
    </div>
  );
}

// System info component
function SystemInfo({ info }: { info: Record<string, string> }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {Object.entries(info).map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <span className="text-muted-foreground text-xs">{key}</span>
          <span className="font-mono text-xs truncate" title={value}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DebugConsolePage() {
  const { toast } = useToast();
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filters, setFilters] = useState<Record<LogLevel, boolean>>({
    error: true,
    warn: true,
    info: true,
    debug: true,
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Subscribe to logs
  useEffect(() => {
    const unsubscribe = secureLogger.subscribe((newLogs) => {
      setLogs(newLogs);
      if (autoScrollRef.current) {
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    // Get initial system info
    setSystemInfo(secureLogger.getSystemInfo());

    // Check if already capturing
    setIsCapturing(secureLogger.isCurrentlyCapturing());

    return () => unsubscribe();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start capturing
  const handleStartCapture = useCallback(() => {
    secureLogger.startCapturing();
    setIsCapturing(true);
    toast({ title: 'Captura iniciada', description: 'Los logs se están capturando.' });
  }, [toast]);

  // Stop capturing
  const handleStopCapture = useCallback(() => {
    secureLogger.stopCapturing();
    setIsCapturing(false);
    toast({ title: 'Captura detenida', description: 'Se detuvo la captura de logs.' });
  }, [toast]);

  // Clear logs
  const handleClearLogs = useCallback(() => {
    secureLogger.clearLogs();
    setExpandedLogs(new Set());
    toast({ title: 'Logs limpiados', description: 'Todos los logs han sido eliminados.' });
  }, [toast]);

  // Export logs
  const handleExportLogs = useCallback(() => {
    const content = secureLogger.exportLogs();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Logs exportados', description: 'El archivo se ha descargado.' });
  }, [toast]);

  // Copy to clipboard
  const handleCopyLogs = useCallback(async () => {
    try {
      const content = secureLogger.exportLogs();
      await navigator.clipboard.writeText(content);
      toast({ title: 'Copiado', description: 'Los logs se copiaron al portapapeles.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar al portapapeles.' });
    }
  }, [toast]);

  // Toggle filter
  const toggleFilter = useCallback((level: LogLevel) => {
    setFilters(prev => ({ ...prev, [level]: !prev[level] }));
  }, []);

  // Toggle log expansion
  const toggleExpand = useCallback((id: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Filtered logs
  const filteredLogs = logs.filter(log => filters[log.level]);

  // Count by level
  const counts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<LogLevel, number>);

  // Refresh system info
  const refreshSystemInfo = useCallback(() => {
    setSystemInfo(secureLogger.getSystemInfo());
    toast({ title: 'Información actualizada' });
  }, [toast]);

  // Loading state while checking admin
  if (loadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consola de Diagnóstico</h1>
            <p className="text-muted-foreground">
              Monitorea procesos y errores de la aplicación en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3 mr-1" /> En línea
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <WifiOff className="h-3 w-3 mr-1" /> Sin conexión
              </Badge>
            )}
            {isCapturing && (
              <Badge className="bg-green-500 animate-pulse">
                <Play className="h-3 w-3 mr-1" /> Capturando
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* System Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshSystemInfo}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SystemInfo info={systemInfo} />
        </CardContent>
      </Card>

      {/* Controls Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Control de Captura
          </CardTitle>
          <CardDescription>
            Los logs se filtran automáticamente para proteger datos sensibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!isCapturing ? (
              <Button onClick={handleStartCapture} className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar Captura
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStopCapture} className="gap-2">
                <Square className="h-4 w-4" />
                Detener Captura
              </Button>
            )}

            <Button variant="outline" onClick={handleExportLogs} disabled={logs.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <Button variant="outline" onClick={handleCopyLogs} disabled={logs.length === 0} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={logs.length === 0} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todos los logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todos los logs capturados. No se pueden recuperar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLogs}>Limpiar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Logs ({filteredLogs.length} de {logs.length})
            </CardTitle>
            <div className="flex items-center gap-1 flex-wrap">
              {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
                <FilterButton
                  key={level}
                  level={level}
                  count={counts[level] || 0}
                  active={filters[level]}
                  onClick={() => toggleFilter(level)}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto border rounded-lg p-2 bg-muted/30">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bug className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay logs</p>
                <p className="text-sm">
                  {!isCapturing
                    ? 'Inicia la captura para ver los logs.'
                    : 'Los logs aparecerán aquí.'}
                </p>
              </div>
            ) : (
              <>
                {filteredLogs.map(log => (
                  <LogItem
                    key={log.id}
                    log={log}
                    expanded={expandedLogs.has(log.id)}
                    onToggle={() => toggleExpand(log.id)}
                  />
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Tips de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Inicia la captura antes de realizar acciones que quieras monitorear.</li>
            <li>Los datos sensibles (nombres, correos, tokens) se filtran automáticamente.</li>
            <li>Usa los filtros para ver solo errores o advertencias.</li>
            <li>Exporta los logs para compartirlos con soporte técnico.</li>
            <li>Haz clic en un log para ver sus detalles completos.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
