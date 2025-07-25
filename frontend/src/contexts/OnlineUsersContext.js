import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

const OnlineUsersContext = createContext([]);

export const OnlineUsersProvider = ({ children }) => {
  const socket = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Request initial online users list (optional, if backend supports)
    // socket.emit("getOnlineUsers");

    // Listen for userStatus events
    const handleUserStatus = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        if (status === "online") {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    };

    // Listen for full online users list (optional, if backend emits)
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("userStatus", handleUserStatus);
    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("userStatus", handleUserStatus);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [socket]);

  return (
    <OnlineUsersContext.Provider value={onlineUsers}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

export const useOnlineUsers = () => useContext(OnlineUsersContext);