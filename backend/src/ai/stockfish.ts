/* eslint-disable @typescript-eslint/no-explicit-any */
type MessageHandler = (msg: string) => void;

class TinyEmitter {
  private handlers: Record<string, MessageHandler[]> = {};
  on(event: string, fn: MessageHandler) {
    (this.handlers[event] ||= []).push(fn);
  }
  off(event: string, fn?: MessageHandler) {
    if (!fn) { delete this.handlers[event]; return; }
    this.handlers[event] = (this.handlers[event] || []).filter(f => f !== fn);
  }
  emit(event: string, msg: string) {
    (this.handlers[event] || []).forEach(fn => fn(msg));
  }
}

declare const global: any;
declare function require(name: string): any;

/**
 * StockfishEngine: lightweight wrapper around Stockfish running in a Worker
 * or via the `stockfish` npm package. Provides an async `calculate` method
 * that returns the bestmove and streams `info` events.
 */
export class StockfishEngine {
  private proc: any | null = null;
  private emitter = new TinyEmitter();
  private started = false;

  constructor(private pathOrFactory?: string) {}

  private createProcess() {
    if (this.proc) return;
    // Try Worker first (web builds / expo web)
    try {
      if (typeof global.Worker === 'function') {
        // Attempt to resolve a stockfish worker bundle path
        // Many setups bundle stockfish.js; leave configurable via constructor
        const p = this.pathOrFactory || 'stockfish.js';
        // eslint-disable-next-line no-undef
        // @ts-ignore
        this.proc = new global.Worker(p);
        this.proc.onmessage = (e: any) => this.handleMessage(e.data);
        this.proc.postMessage = (m: any) => this.proc.postMessage(m);
        return;
      }
    } catch (e) {
      // ignore
    }

    // Fallback to requiring the stockfish package (node / bundlers)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const factory = require('stockfish');
      const instance = typeof factory === 'function' ? factory() : factory;
      // emscripten style: instance.onmessage / instance.postMessage
      this.proc = instance;
      if (typeof instance.onmessage === 'undefined') {
        // some builds use onmessage as function property
        instance.onmessage = (data: any) => this.handleMessage(data);
      } else {
        // Node style uses postMessage and 'message' events via callbacks
        instance.onmessage = (ev: any) => this.handleMessage(ev.data || ev);
      }
    } catch (err) {
      throw new Error('Stockfish engine not available: ' + String(err));
    }
  }

  private handleMessage(msg: any) {
    if (typeof msg !== 'string') {
      // some environments wrap messages: { data: '...' }
      msg = typeof msg === 'object' && msg.data ? msg.data : String(msg);
    }
    msg = msg.trim();
    if (!msg) return;
    // Emit raw lines
    this.emitter.emit('line', msg);
    // Bestmove lines
    if (msg.startsWith('bestmove')) {
      this.emitter.emit('bestmove', msg);
    } else if (msg.startsWith('info')) {
      this.emitter.emit('info', msg);
    } else if (msg.startsWith('uciok') || msg.startsWith('readyok')) {
      this.emitter.emit(msg, msg);
    }
  }

  on(event: 'line' | 'bestmove' | 'info' | 'uciok' | 'readyok', handler: MessageHandler) {
    this.emitter.on(event, handler);
  }

  off(event: string, handler?: MessageHandler) {
    this.emitter.off(event, handler);
  }

  start() {
    if (this.started) return;
    this.createProcess();
    if (!this.proc) throw new Error('Failed to start Stockfish process');
    this.started = true;
    this.send('uci');
    // Wait for readyok when position/ucinewgame sent
  }

  stop() {
    try {
      if (!this.proc) return;
      this.send('quit');
    } finally {
      this.proc = null;
      this.started = false;
    }
  }

  send(cmd: string) {
    if (!this.proc) this.createProcess();
    if (!this.proc) throw new Error('Stockfish process not available');
    try {
      // Some builds expect postMessage string, others expect function call
      if (typeof this.proc.postMessage === 'function') {
        this.proc.postMessage(cmd);
      } else if (typeof this.proc === 'function') {
        this.proc(cmd);
      } else if (typeof this.proc.send === 'function') {
        this.proc.send(cmd);
      }
    } catch (e) {
      // best-effort
      // ignore send errors
    }
  }

  async calculate(fen: string, depth = 10, movetime?: number, options?: { ponder?: boolean }): Promise<{ bestmove: string; info: string[] }> {
    this.start();
    const infos: string[] = [];
    return new Promise((resolve, reject) => {
      let resolved = false;
      const onInfo = (line: string) => {
        infos.push(line);
      };
      const onBest = (line: string) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        const parts = line.split(' ');
        const bestmove = parts[1] || '';
        resolve({ bestmove, info: infos });
      };

      const onErrorTimeout = (reason: string) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        reject(new Error(reason));
      };

      const cleanup = () => {
        this.off('info', onInfo);
        this.off('bestmove', onBest);
        clearTimeout(timer);
      };

      this.on('info', onInfo);
      this.on('bestmove', onBest);

      // position and go
      this.send('ucinewgame');
      this.send(`position fen ${fen}`);
      if (typeof movetime === 'number') {
        this.send(`go movetime ${Math.max(1, Math.floor(movetime))}`);
      } else {
        this.send(`go depth ${Math.max(1, Math.floor(depth))}`);
      }

      const timer = setTimeout(() => onErrorTimeout('Stockfish timeout'), (movetime || depth * 2000) + 10000);
    });
  }

  setOption(name: string, value: string | number | boolean) {
    const v = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    this.send(`setoption name ${name} value ${v}`);
  }
}

export default StockfishEngine;
