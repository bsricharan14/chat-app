// src/components/LoginForm.jsx
import React, { useState } from "react";
import "../styles/auth.css";

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

export default function LoginForm({ switchToRegister, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        onLogin({ user: data.user, token: data.token });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="chat-icon">
            <ChatIcon />
          </div>
          <h1 style={{ color: "#444" }}>Welcome to SlateChat</h1>
          <p style={{ color: "#666" }}>Sign in to continue</p>
        </div>

        <div className={`form-group${error && !identifier ? " error" : ""}`}>
          <input
            type="text"
            placeholder=" "
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <label>Username or Email</label>
        </div>

        <div className={`form-group${error && !password ? " error" : ""}`}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>Password</label>
          <span
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        <div className="toggle-auth">
          New to our chat?{" "}
          <button type="button" onClick={switchToRegister}>
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
