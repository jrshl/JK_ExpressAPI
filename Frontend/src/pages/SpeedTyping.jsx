import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./SpeedTyping.css";

export default function SpeedTyping() {
  const [step, setStep] = useState(0);
  const [currentFact, setCurrentFact] = useState('Press "Start Game" to begin!');
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(30);
  const [result, setResult] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [gameActive, setGameActive] = useState(false);
  const [catMovable, setCatMovable] = useState(true);
  const [prevCatPosition, setPrevCatPosition] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Pause state

  const timerRef = useRef(null);
  const navigate = useNavigate();

  // ===== Timer Circle Setup =====
  const R = 12;
  const circumference = 2 * Math.PI * R;
  const fraction = maxTime ? timeLeft / maxTime : 0;
  const dashOffset = circumference * (1 - fraction);
  const colorVal = Math.round(255 * (1 - fraction));
  const strokeColor = `rgb(${colorVal},${colorVal},${colorVal})`;

  // ===== Fetch Fact (Fixed) =====
  async function fetchFact() {
    try {
      const res = await fetch("/api/facts");
      const data = await res.json();
      
      // Get one random fact from your server's response
      let facts = data.fact || data.facts || [];
      if (Array.isArray(facts) && facts.length > 0) {
        const randomIndex = Math.floor(Math.random() * facts.length);
        const fact = facts[randomIndex];
        return typeof fact === 'string' ? fact : "Cats are amazing creatures!";
      }
      
      return "Cats are amazing creatures!";
    } catch (error) {
      console.error("Error fetching fact:", error);
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

  // ===== Preload Next Fact =====
  const nextFactRef = useRef(null);
  const preloadNextFact = useCallback(async () => {
    nextFactRef.current = await fetchFact();
  }, []);
  useEffect(() => { preloadNextFact(); }, [preloadNextFact]);

  // ===== Start Game =====
  async function startGame() {
    setStep(2);
    const newTimeLeft = getDifficultyTime(difficulty);
    const fact = nextFactRef.current || (await fetchFact());
    setCurrentFact(fact);
    preloadNextFact();

    setTyped("");
    setProgress(0);
    setResult("");
    setTimeLeft(newTimeLeft);
    setMaxTime(newTimeLeft);
    setGameActive(true);
    setCatMovable(true);
    setPrevCatPosition(0);
    setModalOpen(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ===== Fixed Timer Effect (pause/resume works) =====
  useEffect(() => {
    if (!gameActive) return;

    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndGame(false, "Time's up! The cat got caught!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameActive, isPaused]); // reacts to pause/resume

  // ===== End Game =====
  function handleEndGame(won, message) {
    setGameActive(false);
    setResult(message);
    setModalOpen(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ===== Cancel Game =====
  function cancelGame() {
    setGameActive(false);
    setResult("Game canceled!");
    setTyped("");
    setProgress(0);
    setTimeLeft(0);
    setCatMovable(true);
    setPrevCatPosition(0);
    setModalOpen(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ===== Pause Logic =====
  function togglePause(open) {
    setIsMenuOpen(open);
    if (open) setIsPaused(true);
    else setIsPaused(false);
  }

  // ===== Typing Logic =====
  useEffect(() => {
    if (!gameActive || isPaused) return;
    const limit = Math.min(typed.length, currentFact.length);
    let correctCount = 0;
    let hasWrong = false;

    for (let i = 0; i < limit; i++) {
      if (typed[i] === currentFact[i]) correctCount++;
      else hasWrong = true;
    }

    const pct = Math.floor((correctCount / currentFact.length) * 100);
    setProgress(pct);

    setCatMovable(!hasWrong);
    if (!hasWrong) setPrevCatPosition(pct);

    if (correctCount === currentFact.length && gameActive) {
      handleEndGame(true, "Congratulations! You typed the cat fact correctly!");
    }
  }, [typed, currentFact, gameActive]);

  // ===== Key Listener =====
  useEffect(() => {
    function handleKeyDown(e) {
      if (!gameActive || isPaused) return;
      if (e.key.length === 1) {
        if (typed.length >= currentFact.length) return;
        setTyped(prev => prev + e.key);
      } else if (e.key === "Backspace") {
        setTyped(prev => prev.slice(0, -1));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, isPaused, typed, currentFact]);

  // ===== RENDER =====
  return (
    <div className="speed-typing-game">
      {/* Hamburger button to pause */}
      <button className="hamburger" onClick={() => togglePause(true)}>
        <span></span><span></span><span></span>
      </button>

      {/* ===== Pause Menu ===== */}
      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => togglePause(false)}>
          <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-buttons">
              <button className="menu-btn resume-btn" onClick={() => togglePause(false)}>
                Resume
              </button>
              <button className="menu-btn restart-btn" onClick={() => { togglePause(false); startGame(); }}>
                Restart
              </button>
              <button className="menu-btn exit-btn" onClick={() => navigate("/")}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="background-layer"></div>

      {/* ===== GUIDE SCREENS ===== */}
      {(step === 0 || step === 1) && (
        <div className="GuideContainer">
          {step === 0 && (
            <>
              <h1>Cat Speed Typing Adventure</h1>
              <p className="instructions">
                Type the cat fact as fast as you can! The faster you type correctly,
                the further the cat runs toward the goal.
              </p>
              <div className="controls">
                <button onClick={() => setStep(1)}>Next</button>
                <button className="start-btn" onClick={startGame}>Start Game</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>How to Play</h2>
              <ul>
                <li>Choose difficulty</li>
                <li>Press <b>Start Game</b></li>
                <li>Type directly on keyboard</li>
                <li>Only correct letters move the cat; wrong letters stop it</li>
              </ul>
              <div className="controls">
                <button onClick={() => setStep(0)}>Back</button>
                <button className="start-btn" onClick={startGame}>Start Game</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== GAME SCREEN ===== */}
      {step === 2 && (
        <div className="GameContainer">
          <div className="game-area">
            <div className={`track ${gameActive && !isPaused ? "active" : ""}`}>
              {/* Timer Circle */}
              <div className="answer-timer">
                <svg viewBox={`0 0 ${R * 2 + 6} ${R * 2 + 6}`} style={{ width: "40px", height: "40px" }}>
                  <circle cx={R + 3} cy={R + 3} r={R} className="timer-bg" />
                  <circle
                    cx={R + 3}
                    cy={R + 3}
                    r={R}
                    className="timer-progress"
                    stroke={strokeColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <span className="timer-text">{timeLeft}</span>
              </div>

              {/* Background Layers */}
              <div className="bg-static gif"></div>
              <div className="bg-layer bg3"></div>
              <div className="bg-layer bg1"></div>
              <div className="bg-layer bg2"></div>
              <div className="road"></div>
              <div className="bushes"></div>
              <div className="foreground-layer"></div>

              <img
                src="images/catwalk.gif"
                alt="Cat"
                className="cat"
                style={{ left: catMovable ? `${progress}%` : `${prevCatPosition}%` }}
              />

              {/* Progress Line */}
              <div className="progress-line">
                <div
                  className="tracker-cat"
                  style={{ left: catMovable ? `${progress}%` : `${prevCatPosition}%` }}
                ></div>
                <div className="line-end">🏁</div>
              </div>
            </div>

            {/* Fact Box */}
            <div className="fact-box">
              {(currentFact && typeof currentFact === 'string' ? currentFact : 'Press "Start Game" to begin!').split("").map((char, idx) => {
                let cls = "untyped-char";
                if (idx < typed.length) cls = typed[idx] === char ? "typed-char" : "wrong-char";
                return <span key={idx} className={cls}>{char}</span>;
              })}
            </div>

            {/* Controls */}
            <div className="controls bottom-controls">
              <label>Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={gameActive}
              >
                <option value="easy">Easy (45s)</option>
                <option value="medium">Medium (30s)</option>
                <option value="hard">Hard (20s)</option>
              </select>
              <button className="start-btn" onClick={startGame} disabled={gameActive}>Restart Game</button>
              <button className="cancel-btn" onClick={cancelGame} disabled={!gameActive}>Cancel Game</button>
            </div>
          </div>

          {/* End Modal */}
          {modalOpen && (
            <div className="modal-overlay">
              <div className="end-modal-content">
                <h2>{result.includes("Congratulations") ? "You Won!" : "You Lost!"}</h2>
                <p>{currentFact}</p>
                <button className="start-btn" onClick={startGame}>Try Again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
