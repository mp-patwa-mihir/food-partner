import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

export function initSocketServer() {
  if (process.env.NODE_ENV !== "production") {
    // Prevent multiple initializations in dev caused by Next HMR
    if ((global as any).__SOCKET_SERVER_STARTED__) {
      console.log("[Socket] Server already running on port", PORT);
      return (global as any).io;
    }
  }

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // allow all or restrict to NEXT_PUBLIC_BASE_URL
      methods: ["GET", "POST"]
    }
  });

  // JWT Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const actualToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    try {
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || "fallback_secret") as jwt.JwtPayload;
      if (!decoded.id || !decoded.role) {
        return next(new Error("Authentication error: Invalid token structure"));
      }

      // Attach user data to socket for downstream usage
      socket.data.user = {
        userId: decoded.id,
        role: decoded.role
      };

      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, role } = socket.data.user;
    console.log(`[Socket] User connected - ID: ${userId}, Role: ${role}`);

    // Room Joining Logic Based on Role
    try {
      if (role === "CUSTOMER") {
        socket.join(`user:${userId}`);
        console.log(`[Socket] Joined Room: user:${userId}`);
      } else if (role === "ADMIN") {
        socket.join("admin:global");
        console.log(`[Socket] Joined Room: admin:global`);
      } else if (role === "PROVIDER") {
        try {
          const mongoose = require("mongoose");
          const connectDB = require("../lib/mongodb").default;
          await connectDB();
          
          const Restaurant = require("../models/Restaurant").Restaurant;
          const restaurant = await Restaurant.findOne({ provider: userId });
          
          if (restaurant) {
            socket.join(`provider:${restaurant._id.toString()}`);
            console.log(`[Socket] Joined Room: provider:${restaurant._id.toString()}`);
          } else {
            console.log(`[Socket] Warning: Provider ${userId} connected but has no restaurant. No provider room joined.`);
          }
        } catch (dbErr) {
          console.error(`[Socket] Error fetching restaurant for PROVIDER ${userId}:`, dbErr);
        }
      } else {
        console.log(`[Socket] Unrecognized role: ${role}. No rooms joined.`);
      }
    } catch (err) {
      console.error("[Socket] Error joining rooms:", err);
    }

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User disconnected - ID: ${userId}, Reason: ${reason}`);
    });
    
    // Explicit Instruction: Do not mix order logic here.
  });

  httpServer.listen(PORT, () => {
    console.log(`[Socket] Server started and listening independently on port ${PORT}`);
    
    if (process.env.NODE_ENV !== "production") {
      (global as any).__SOCKET_SERVER_STARTED__ = true;
      (global as any).io = io;
    }
  });

  return io;
}
