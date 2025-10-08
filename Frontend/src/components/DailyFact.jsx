import React, { useEffect, useState } from "react";
import "./DailyFact.css";

function generateFactId(fact) {
  let hash = 0;
  for (let i = 0; i < fact.length; i++) {
    const char = fact.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 234 + 1;
}

export default function DailyFact({ weeklyMap, todayKey, addEncounteredFact, onStoreComplete, onClose }) {
  const [fact, setFact] = useState(null);
  const [factId, setFactId] = useState(null);
  const [isStoring, setIsStoring] = useState(false);

  useEffect(() => {
    if (!weeklyMap || !todayKey) return;
    const f = weeklyMap[todayKey] || null;
    if (f) {
      const id = generateFactId(f);
      setFact(f);
      setFactId(id);
      if (addEncounteredFact) addEncounteredFact(id, f);
    }
  }, [weeklyMap, todayKey, addEncounteredFact]);

  if (!fact) return null;

  const handleStore = (e) => {
    e.stopPropagation();
    if (isStoring) return;
    setIsStoring(true);
    setTimeout(() => {
      setIsStoring(false);
      if (addEncounteredFact) addEncounteredFact(factId, fact);
      if (onStoreComplete) onStoreComplete([factId]);
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