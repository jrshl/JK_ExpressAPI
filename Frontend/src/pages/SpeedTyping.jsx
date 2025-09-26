import React, { useState, useRef, useEffect } from "react";
import GameControls from "../components/GameControls";
import CatTrack from "../components/CatTrack";
import TypingArea from "../components/TypingArea";
import GameStatus from "../components/GameStatus";
import "./SpeedTyping.css";

export default function SpeedTyping() {
  const [currentFact, setCurrentFact] = useState("Press \"Start Game\" to begin!");
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef(null);

  // Fetch a cat fact from backend
  async function fetchFact() {
    try {
      const res = await fetch("/api/facts");
      const data = await res.json();
      return data.fact[0];
    } catch (error) {
      return "Cats are amazing creatures!";
    }
  }

  // Set difficulty time limits
  function getDifficultyTime(level) {
    switch (level) {
      case "easy": return 45;
      case "medium": return 30;
      case "hard": return 20;
      default: return 30;
    }
  }

  // Start game
  async function startGame() {
    const newTimeLeft = getDifficultyTime(difficulty);
    const fact = await fetchFact();
    
    setCurrentFact(fact);
    setTyped("");
    setProgress(0);
    setResult("");
    setTimeLeft(newTimeLeft);
    setGameActive(true);

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(false, "⏳ Time's up! The cat got caught!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // End game
  function endGame(won, message) {
    setGameActive(false);
    setResult(message);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Cancel game
  function cancelGame() {
    setGameActive(false);
    setResult("❌ Game canceled!");
    setTyped("");
    setProgress(0);
    setTimeLeft(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Handle typing input
  function handleTyping(value) {
    setTyped(value);
    const correctPart = currentFact.substring(0, value.length);
    
    if (value === correctPart) {
      const newProgress = Math.floor((value.length / currentFact.length) * 100);
      setProgress(newProgress);
      
      if (newProgress === 100) {
        endGame(true, "🎉 You finished in time! The cat reached the goal!");
      }
    }
  }

  // Handle difficulty change
  function handleDifficultyChange(level) {
    setDifficulty(level);
    if (!gameActive) {
      setTimeLeft(getDifficultyTime(level));
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="speed-typing-game">
      <div className="overlay">
        <h1>🐱 Cat Speed Typing Adventure</h1>
        <p className="instructions">
          Type the cat fact as fast as you can! The faster you type, the further the cat runs toward the goal 🏁
        </p>

      <GameControls
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onStartGame={startGame}
        onCancelGame={cancelGame}
        gameActive={gameActive}
      />

      <div className="game-area">
        <CatTrack progress={progress} />
      </div>

      <TypingArea
        currentFact={currentFact}
        typed={typed}
        onTyping={handleTyping}
        gameActive={gameActive}
      />

      <GameStatus
        progress={progress}
        timeLeft={timeLeft}
        result={result}
      />
      </div>
    </div>
  );
}