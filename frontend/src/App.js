// src/App.js
import { useAuth } from "./contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const { user, setUser } = useAuth();

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

  return (
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
  );
}

export default App;
