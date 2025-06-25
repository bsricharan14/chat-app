// src/pages/AuthPage.jsx
import { useState } from "react";
import LoginForm from "../components/Login";
import RegisterForm from "../components/Register";

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="auth-page">
      {isLogin ? (
        <LoginForm switchToRegister={switchToRegister} onLogin={onLogin} />
      ) : (
        <RegisterForm switchToLogin={switchToLogin} onLogin={onLogin} />
      )}
    </div>
  );
}
