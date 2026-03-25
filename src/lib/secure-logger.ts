// Secure Logger Utility for Admin Debug Console
// Intercepts console methods and stores logs securely (no sensitive data)

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  rawArgs?: string; // Stringified sanitized args
}

// Maximum logs to keep in memory (prevents memory issues)
const MAX_LOGS = 500;

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /apiKey/i,
  /secret/i,
  /credential/i,
  /auth/i,
  /privateKey/i,
];

// Sensitive value patterns to redact
const SENSITIVE_VALUES = [
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]+$/, // JWT tokens
  /^AIza[A-Za-z0-9_-]{33}$/, // Firebase API keys
  /^ghp_[A-Za-z0-9]{36}$/, // GitHub tokens
  /^[0-9]{10,}$/, // Phone numbers
  /@.*\.(com|mx|org|edu)/, // Email patterns (partial redaction)
];

// Fields that contain student/person data to redact
const PERSONAL_FIELDS = ['name', 'firstName', 'lastName', 'phone', 'email', 'photo', 'parentName', 'parentPhone'];

class SecureLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private isCapturing = false;
  private originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  // Generate unique ID for each log
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sanitize a single value
  private sanitizeValue(value: any, depth: number = 0): any {
    if (depth > 5) return '[MAX_DEPTH]';
    if (value === null) return null;
    if (value === undefined) return undefined;

    // Handle primitives
    if (typeof value === 'string') {
      // Check for sensitive value patterns
      for (const pattern of SENSITIVE_VALUES) {
        if (pattern.test(value)) {
          return '[REDACTED]';
        }
      }
      // Truncate very long strings
      if (value.length > 200) {
        return value.substring(0, 200) + '...[TRUNCATED]';
      }
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle functions
    if (typeof value === 'function') {
      return '[FUNCTION]';
    }

    // Handle Error objects
    if (value instanceof Error) {
      return {
        name: value.name,
        message: this.sanitizeValue(value.message, depth + 1),
        stack: value.stack ? '[STACK_TRACE]' : undefined,
      };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > 20) {
        return `[Array(${value.length}) - truncated]`;
      }
      return value.map(item => this.sanitizeValue(item, depth + 1));
    }

    // Handle objects
    if (typeof value === 'object') {
      const sanitized: any = {};
      const keys = Object.keys(value).slice(0, 30); // Limit keys

      for (const key of keys) {
        // Check for sensitive field names
        const isSensitiveField = SENSITIVE_PATTERNS.some(p => p.test(key)) ||
                                 PERSONAL_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()));

        if (isSensitiveField) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeValue(value[key], depth + 1);
        }
      }

      return sanitized;
    }

    return String(value);
  }

  // Sanitize and stringify arguments
  private sanitizeArgs(args: any[]): string {
    try {
      const sanitized = args.map(arg => this.sanitizeValue(arg));
      return JSON.stringify(sanitized, null, 2);
    } catch (e) {
      return '[UNSTRINGIFIABLE]';
    }
  }

  // Create a log entry
  private createLog(level: LogLevel, args: any[]): LogEntry {
    const message = args.map(arg => {
      if (typeof arg === 'string') return this.sanitizeValue(arg);
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(this.sanitizeValue(arg));
      } catch {
        return String(arg);
      }
    }).join(' ');

    return {
      id: this.generateId(),
      level,
      message: message.substring(0, 1000), // Limit message length
      timestamp: new Date(),
      rawArgs: this.sanitizeArgs(args),
    };
  }

  // Add log to storage
  private addLog(log: LogEntry): void {
    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Notify all listeners of log updates
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.logs]);
      } catch (e) {
        // Ignore listener errors
      }
    });
  }

  // Start capturing console output
  public startCapturing(): void {
    if (this.isCapturing) return;
    this.isCapturing = true;

    const self = this;

    console.log = (...args: any[]) => {
      self.originalConsole.log.apply(console, args);
      self.addLog(self.createLog('info', args));
    };

    console.warn = (...args: any[]) => {
      self.originalConsole.warn.apply(console, args);
      self.addLog(self.createLog('warn', args));
    };

    console.error = (...args: any[]) => {
      self.originalConsole.error.apply(console, args);
      self.addLog(self.createLog('error', args));
    };

    console.info = (...args: any[]) => {
      self.originalConsole.info.apply(console, args);
      self.addLog(self.createLog('info', args));
    };

    console.debug = (...args: any[]) => {
      self.originalConsole.debug.apply(console, args);
      self.addLog(self.createLog('debug', args));
    };

    this.addLog({
      id: this.generateId(),
      level: 'info',
      message: '🔍 Debug console capture started',
      timestamp: new Date(),
    });
  }

  // Stop capturing console output
  public stopCapturing(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    this.addLog({
      id: this.generateId(),
      level: 'info',
      message: '⏹️ Debug console capture stopped',
      timestamp: new Date(),
    });
  }

  // Get all logs
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear all logs
  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  // Subscribe to log updates
  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately send current logs
    listener([...this.logs]);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Export logs as text
  public exportLogs(): string {
    const header = `=== DEBUG CONSOLE EXPORT ===\nGenerated: ${new Date().toISOString()}\nTotal Logs: ${this.logs.length}\n\n`;

    const logsText = this.logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const level = log.level.toUpperCase().padEnd(5);
      let line = `[${timestamp}] [${level}] ${log.message}`;
      if (log.rawArgs && log.rawArgs !== '[]') {
        line += `\n  Args: ${log.rawArgs}`;
      }
      return line;
    }).join('\n\n');

    return header + logsText;
  }

  // Check if capturing
  public isCurrentlyCapturing(): boolean {
    return this.isCapturing;
  }

  // Get system info for diagnostics
  public getSystemInfo(): Record<string, string> {
    const info: Record<string, string> = {
      'User Agent': navigator.userAgent,
      'Platform': navigator.platform,
      'Language': navigator.language,
      'Online': navigator.onLine ? 'Yes' : 'No',
      'Screen': `${screen.width}x${screen.height}`,
      'Viewport': `${window.innerWidth}x${window.innerHeight}`,
      'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'Timestamp': new Date().toISOString(),
    };

    // Memory info (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      info['Memory Used'] = `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
      info['Memory Total'] = `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
    }

    return info;
  }
}

// Singleton instance
export const secureLogger = new SecureLogger();
