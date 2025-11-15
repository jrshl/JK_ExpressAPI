import React from "react";
import "./SuccessModal.css";

export default function SuccessModal({ message, onClose }) {
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-box">
        <div className="success-icon">✓</div>
        <h3>{message}</h3>
        <button className="success-modal-btn" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
