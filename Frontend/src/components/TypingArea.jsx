import React from "react";

export default function TypingArea({ currentFact, typed, onTyping, gameActive }) {
  return (
    <div className="typing-area">
      <p className="fact">{currentFact}</p>
      <textarea
        placeholder="Type here..."
        rows={3}
        value={typed}
        onChange={(e) => onTyping(e.target.value)}
        disabled={!gameActive}
        className="typing-input"
      />
    </div>
  );
}