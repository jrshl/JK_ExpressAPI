import React from "react";

export default function GameStatus({ 
  progress, 
  timeLeft, 
  result, 
  score,
  showProgress = true,
  showScore = false 
}) {
  return (
    <div className="status">
      {showProgress && <p className="progress">Progress: {progress}%</p>}
      {showScore && <p className="score">Score: {score}</p>}
      <p className="timer">Time left: {timeLeft}s</p>
      <p className="result">{result}</p>
    </div>
  );
}