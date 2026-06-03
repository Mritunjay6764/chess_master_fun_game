import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const createSocketServer = (httpServer: HttpServer): SocketIOServer => {
  return new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });
};