import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

export function initSocketServer() {
  if (process.env.NODE_ENV !== "production") {
    if ((global as any).__SOCKET_SERVER_STARTED__) {
      console.log("[Socket] Server already running on port", PORT);
      return (global as any).io;
    }
  }

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // JWT Authentication Middleware using shared lib/auth
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) return next(new Error("Authentication error: No token provided"));

    const actualToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    try {
      // Dynamic import to avoid issues in some environments
      const { verifyToken } = require("../lib/auth");
      const result = await verifyToken(actualToken);

      if (!result.success) {
        return next(new Error(`Authentication error: ${result.error}`));
      }

      socket.data.user = result.payload;
      next();
    } catch (err) {
      console.error("[Socket] Auth error:", err);
      return next(new Error("Authentication error: Validation failed"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, role } = socket.data.user;
    console.log(`[Socket] Connected: ${userId} (${role})`);

    if (role === "CUSTOMER") {
      socket.join(`user:${userId}`);
    } else if (role === "PROVIDER") {
      try {
        const { connectDB } = require("../lib/db");
        await connectDB();
        const Restaurant = require("../models/Restaurant").default;
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (restaurant) {
          socket.join(`provider:${restaurant._id.toString()}`);
          console.log(`[Socket] Joined Provider Room: ${restaurant._id}`);
        }
      } catch (err) {
        console.error("[Socket] Provider room error:", err);
      }
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`[Socket] Live on port ${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      (global as any).__SOCKET_SERVER_STARTED__ = true;
      (global as any).io = io;
    }
  });

  return io;
}
