import { Server, Socket } from "socket.io";
import http from "http";
import express, { type Express } from "express";

const app: Express = express();
const server: http.Server = http.createServer(app);

const io: Server = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
  maxHttpBufferSize: 5 * 1024 * 1024, // 5MB
});

const userSocketMap: Record<string, string> = {};

export function getReceiverSocketId(userId: string): string | undefined {
  return userSocketMap[userId];
}

io.on("connection", (socket: Socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // send updated list of online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
