// src/App.js
import { useAuth } from "./contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import { OnlineUsersProvider } from "./contexts/OnlineUsersContext";
import { useEffect } from "react";
import { useSocket } from "./contexts/SocketContext"; // or however you access socket

function App() {
  const { user, setUser } = useAuth();
  const socket = useSocket();

  const handleLogin = ({ user, token }) => {
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("chat-user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("chat-user");
  };

  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join", user._id);

    const handleForceLogout = () => {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("chat-user");
      window.location.href = "/login";
    };

    socket.on("forceLogout", handleForceLogout);

    return () => {
      socket.off("forceLogout", handleForceLogout);
    };
  }, [socket, user]);

  return (
    <OnlineUsersProvider>
      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <AuthPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/chat" replace />
            )
          }
        />
        <Route
          path="/chat"
          element={
            user ? (
              <ChatPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </OnlineUsersProvider>
  );
}

export default App;
