type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: string;
  constructor(context: string) { this.context = context; }
  
  private log(level: LogLevel, message: string, meta?: any): void {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${level.toUpperCase()}] [${this.context}] ${message}`, meta || '');
  }
  debug(m: string, x?: any) { this.log('debug', m, x); }
  info(m: string, x?: any) { this.log('info', m, x); }
  warn(m: string, x?: any) { this.log('warn', m, x); }
  error(m: string, x?: any) { this.log('error', m, x); }
}

export const createLogger = (ctx: string) => new Logger(ctx);