import React from "react";
import "./AuthLoader.css";

export default function AuthLoader({ message }) {
  return (
    <div className="auth-loader-overlay">
      <div className="auth-loader-content">
        <div className="auth-spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}
