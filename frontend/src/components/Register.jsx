// src/components/RegisterForm.jsx
import React, { useState } from "react";
import "../styles/auth.css";

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

export default function RegisterForm({ switchToLogin, onLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.username) errs.username = "Username is required";
    if (!formData.email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      errs.email = "Email is invalid";
    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || "Registration failed");
      } else {
        onLogin({ user: data.user, token: data.token });
      }
    } catch (err) {
      console.error("Register error:", err);
      setErrorMessage("Server error");
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
          <h1 style={{ color: "#444" }}>Join SlateChat</h1>
          <p style={{ color: "#666" }}>Create an account</p>
        </div>

        <div className={`form-group${errors.username ? " error" : ""}`}>
          <input
            type="text"
            name="username"
            placeholder=" "
            value={formData.username}
            onChange={handleChange}
            required
          />
          <label>Username</label>
          {errors.username && (
            <div className="error-message">{errors.username}</div>
          )}
        </div>

        <div className={`form-group${errors.email ? " error" : ""}`}>
          <input
            type="email"
            name="email"
            placeholder=" "
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>Email Address</label>
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className={`form-group${errors.password ? " error" : ""}`}>
          <input
            type="password"
            name="password"
            placeholder=" "
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label>Password</label>
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
        </div>

        <div className={`form-group${errors.confirmPassword ? " error" : ""}`}>
          <input
            type="password"
            name="confirmPassword"
            placeholder=" "
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <label>Confirm Password</label>
          {errors.confirmPassword && (
            <div className="error-message">{errors.confirmPassword}</div>
          )}
        </div>

        {errorMessage && (
          <div className="error-message" style={{ textAlign: "center" }}>
            {errorMessage}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Register"}
        </button>

        <div className="toggle-auth">
          Already have an account?{" "}
          <button type="button" onClick={switchToLogin}>
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
