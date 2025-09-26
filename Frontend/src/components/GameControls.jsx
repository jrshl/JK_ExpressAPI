import React from "react";

export default function GameControls({ 
  difficulty, 
  onDifficultyChange, 
  onStartGame, 
  onCancelGame, 
  gameActive,
  showDifficulty = true,
  startText = "Start Game",
  cancelText = "Cancel"
}) {
  return (
    <div className="controls">
      {showDifficulty && (
        <>
          <label htmlFor="difficulty">Choose Difficulty:</label>
          <select 
            id="difficulty" 
            value={difficulty} 
            onChange={(e) => onDifficultyChange(e.target.value)}
            disabled={gameActive}
          >
            <option value="easy">Easy (45s)</option>
            <option value="medium">Medium (30s)</option>
            <option value="hard">Hard (20s)</option>
          </select>
        </>
      )}
      <button 
        onClick={onStartGame} 
        disabled={gameActive}
        className="start-btn"
      >
        {startText}
      </button>
      <button 
        onClick={onCancelGame} 
        disabled={!gameActive}
        className="cancel-btn"
      >
        {cancelText}
      </button>
    </div>
  );
}