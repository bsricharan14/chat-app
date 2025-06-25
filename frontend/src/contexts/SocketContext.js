import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    console.log("[SocketContext] Connecting socket for user:", user);
    const newSocket = io(process.env.REACT_APP_API_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("[SocketContext] Socket connected:", newSocket.id);
      newSocket.emit("join", user._id);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("[SocketContext] Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[SocketContext] Socket connection error:", err);
    });

    setSocket(newSocket);

    return () => {
      console.log("[SocketContext] Disconnecting socket");
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
