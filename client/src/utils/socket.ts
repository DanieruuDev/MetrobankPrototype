import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

// 🧩 Extend the default Socket type to include our custom flag
interface CustomSocket extends Socket<DefaultEventsMap, DefaultEventsMap> {
  _userRegistered?: boolean;
}

const VITE_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ✅ Create a single typed socket instance
export const socket: CustomSocket = io(VITE_BACKEND_URL, {
  withCredentials: true,
  autoConnect: true,
});

// ✅ Prevent duplicate registration
if (socket._userRegistered === undefined) {
  socket._userRegistered = false;
}
