import { io, Socket } from "socket.io-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URLL || "http://localhost:8000";

// create a single socket instance
export const socket: Socket = io(API_BASE_URL, {
  autoConnect: true,
});
