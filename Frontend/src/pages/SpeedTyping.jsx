import React, { useState, useRef, useEffect } from "react";
import "./SpeedTyping.css";

export default function SpeedTyping() {
  const [step, setStep] = useState(0); // NEW: step 0 = intro, 1 = tutorial2, 2 = game

  const [currentFact, setCurrentFact] = useState('Press "Start Game" to begin!');
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef(null);

  // --- Fetch cat fact
  async function fetchFact() {
    try {
      const res = await fetch("https://meowfacts.herokuapp.com/");
      const data = await res.json();
      return data.fact[0];
    } catch {
      return "Cats are amazing creatures!";
    }
  }

  function getDifficultyTime(level) {
    switch (level) {
      case "easy": return 45;
      case "medium": return 30;
      case "hard": return 20;
      default: return 30;
    }
  }

  async function startGame() {
    setStep(2); // Go to game screen
    const newTimeLeft = getDifficultyTime(difficulty);
    const fact = await fetchFact();

    setCurrentFact(fact);
    setTyped("");
    setProgress(0);
    setResult("");
    setTimeLeft(newTimeLeft);
    setGameActive(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(false, "⏰ Time's up! The cat got caught!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function endGame(won, message) {
    setGameActive(false);
    setResult(message);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

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

  function handleDifficultyChange(level) {
    setDifficulty(level);
    if (!gameActive) {
      setTimeLeft(getDifficultyTime(level));
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- RENDERING
  return (
    <div className="speed-typing-game">
      <div className="background-layer"></div>
      <div className="Container">

        {/* STEP 0: Intro */}
        {step === 0 && (
          <>
            <h1>🐱 Cat Speed Typing Adventure</h1>
            <p className="instructions">
              Type the cat fact as fast as you can! The faster you type, the further the cat runs toward the goal 🏁
            </p>
            <div className="controls">
              <button onClick={() => setStep(1)}>Next ➡️</button>
              <button className="start-btn" onClick={startGame}>Start Game</button>
            </div>
          </>
        )}

        {/* STEP 1: Tutorial 2 (extra instructions) */}
        {step === 1 && (
          <>
            <h2>📖 How to Play</h2>
            <ul style={{ textAlign: "left" }}>
              <li>Choose your difficulty (Easy, Medium, Hard).</li>
              <li>Press <b>Start Game</b> to begin.</li>
              <li>Type the cat fact shown as fast as you can.</li>
              <li>The faster you type, the faster the cat reaches the goal!</li>
            </ul>
            <div className="controls">
              <button onClick={() => setStep(0)}>⬅️ Back</button>
              <button className="start-btn" onClick={startGame}>Start Game</button>
            </div>
          </>
        )}

        {/* STEP 2: Actual Game */}
        {step === 2 && (
          <>
            {/* Controls */}
            <div className="controls">
              <label>Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                disabled={gameActive}
              >
                <option value="easy">Easy (45s)</option>
                <option value="medium">Medium (30s)</option>
                <option value="hard">Hard (20s)</option>
              </select>

              <button className="start-btn" onClick={startGame} disabled={gameActive}>
                Restart Game
              </button>
              <button className="cancel-btn" onClick={cancelGame} disabled={!gameActive}>
                Cancel Game
              </button>
            </div>

            {/* Game Area */}
            <div className="game-area">
              <div className={`track ${gameActive ? "active" : ""}`}>
                <div className="road"></div>
                <div className="bushes"></div>
                <div className="foreground-layer"></div>

                <img
                  src="images/running_cat.gif"
                  alt="Cat"
                  className="cat"
                  style={{ left: `${progress}%` }}
                />
                <div className="finish-line">🏁</div>
              </div>
            </div>

            {/* Typing */}
            <div className="typing-area">
              <div className="fact">{currentFact}</div>
              <textarea
                className="typing-input"
                value={typed}
                onChange={(e) => handleTyping(e.target.value)}
                disabled={!gameActive}
                placeholder="Start typing here..."
              />
            </div>

            {/* Status */}
            <div className="status">
              <p className="progress">Progress: {progress}%</p>
              <p className="timer">⏱ Time Left: {timeLeft}s</p>
              <p className="result">{result}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
