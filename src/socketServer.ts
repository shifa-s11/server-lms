import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import UserModel from "./models/user.model";

let ioInstance: SocketIOServer | null = null;

const serializeNotification = (notification: unknown) =>
  JSON.parse(JSON.stringify(notification));

export const emitAdminNotification = (notification: unknown) => {
  ioInstance?.to("admin").emit(
    "newNotification",
    serializeNotification(notification)
  );
};

export const emitUserNotification = (
  userId: string | undefined,
  notification: unknown
) => {
  if (!userId) return;
  ioInstance?.to(`user:${userId}`).emit(
    "newNotification",
    serializeNotification(notification)
  );
};

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server);
  ioInstance = io;

  io.on("connection", async (socket: Socket) => {
    try {
      const userId = socket.handshake.auth?.userId as string | undefined;

      if (!userId) {
        console.log("Socket connection rejected: missing userId");
        socket.disconnect();
        return;
      }

      socket.join(`user:${userId}`);

      const user = await UserModel.findById(userId).select("role");

      if (user?.role === "admin") {
        socket.join("admin");
      }

      console.log(`Socket connected for user:${userId}`);

      socket.on("disconnect", () => {
        console.log(`Socket disconnected for user:${userId}`);
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      socket.disconnect();
    }
  });
};
