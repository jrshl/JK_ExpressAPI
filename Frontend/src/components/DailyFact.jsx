import React, { useState } from "react";
import "./DailyFact.css";

export default function DailyFact({ fact, factId, onClose }) {
  const [isStoring, setIsStoring] = useState(false);

  if (!fact || !factId) return null;

  const handleStore = (e) => {
    e.stopPropagation();
    if (isStoring) return;
    setIsStoring(true);
    setTimeout(() => {
      setIsStoring(false);
      if (onClose) onClose();
    }, 1000);
  };

  return (
    <div className="daily-overlay" onClick={handleStore}>
      <div className={`daily-card ${isStoring ? "storing" : "pop-in"}`}>
        <div className="daily-label">Daily Cat Fact</div>
        <div className="daily-body">
          <div className="daily-number">#{factId}</div>
          <div className="daily-text">{fact}</div>
        </div>
        <div className="daily-hint">Click anywhere to store to library</div>
      </div>
    </div>
  );
}