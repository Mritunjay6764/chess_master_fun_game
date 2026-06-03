import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initializeGameSocket } from './websocket/game.socket';
import { createLogger } from './utils/logger';

const logger = createLogger('server');
const app    = express();
const http   = createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
// In dev: allow ALL origins so Expo tunnel (https://xxxx.exp.direct),
// LAN IPs, and simulators can all connect without CORS errors.
// In prod: restrict to ALLOWED_ORIGINS env var.
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
  ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  : [];

app.use(cors({
  // true = reflect request Origin (works for credentials); '*' breaks credentials
  origin: isProd ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json());

// ─── REST routes ─────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import aiRoutes from './routes/ai.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import userRoutes from './routes/user.routes';
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/user', userRoutes);
// Frontend REST client uses /api/* endpoints.
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Socket.IO ───────────────────────────────────────────────────────────────
// FIX: origin '*' in dev — Expo tunnel sends an Origin header that Socket.IO's
// default policy rejects unless configured explicitly.
// FIX: both transports listed so polling handshake succeeds on tunnel first,
// then the client upgrades to websocket.
const io = new Server(http, {
  cors: {
    origin: isProd ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: false, // MUST be false when origin is '*'
  },
  transports: ['polling', 'websocket'], // polling first — required for tunnel
  pingTimeout:  20000,
  pingInterval: 10000,
  allowEIO3:    true, // allow older clients
});

initializeGameSocket(io);

// ─── Listen ──────────────────────────────────────────────────────────────────
// FIX: '0.0.0.0' — binds to ALL network interfaces so the server is reachable
// from tunnel, LAN, Docker etc. — not just loopback (127.0.0.1)
const PORT = parseInt(process.env.PORT ?? '3001', 10);
http.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Server running on 0.0.0.0:${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   NODE_ENV: ${process.env.NODE_ENV}`);
});

export { app, io };
