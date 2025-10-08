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
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [shouldRetryCurrentFact, setShouldRetryCurrentFact] = useState(false);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);
  const navigate = useNavigate();

  // Update ref when isPaused changes
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Timer circle setup
  const R = 12;
  const circumference = 2 * Math.PI * R;
  const fraction = maxTime ? timeLeft / maxTime : 0;
  const dashOffset = circumference * (1 - fraction);
  const colorVal = Math.round(255 * (1 - fraction));
  const strokeColor = `rgb(${colorVal},${colorVal},${colorVal})`;

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

  // Preload next fact instantly
  const nextFactRef = useRef(null);
  const preloadNextFact = useCallback(async () => {
    nextFactRef.current = await fetchFact();
  }, []);
  useEffect(() => { preloadNextFact(); }, [preloadNextFact]);

  // Function to start a fresh game (from guide pages)
  function startFreshGame() {
    setShouldRetryCurrentFact(false);
    startGame();
  }

  async function startGame() {
    setStep(2);
    const newTimeLeft = getDifficultyTime(difficulty);
    
    // Only get new fact if not retrying current one
    if (!shouldRetryCurrentFact) {
      const fact = nextFactRef.current || (await fetchFact());
      setCurrentFact(fact);
      preloadNextFact();
    }
    
    // Reset retry flag
    setShouldRetryCurrentFact(false);

    setTyped("");
    setProgress(0);
    setResult("");
    setTimeLeft(newTimeLeft);
    setMaxTime(newTimeLeft);
    setCatMovable(true);
    setPrevCatPosition(0);
    setModalOpen(false);
    setIsPaused(false);

    // Start countdown before game begins
    await startCountdown();
    
    setGameActive(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // Only decrease time if not paused
        if (!isPausedRef.current) {
          if (prev <= 1) {
            handleEndGame(false, "Time's up! The cat got caught!");
            return 0;
          }
          return prev - 1;
        }
        return prev;
      });
    }, 1000);
  }

  function handleEndGame(won, message) {
    setGameActive(false);
    setResult(message);
    setModalOpen(true);
    
    // Set retry flag based on whether user won or lost
    setShouldRetryCurrentFact(!won);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Countdown before game starts
  async function startCountdown() {
    setShowCountdown(true);
    for (let i = 3; i > 0; i--) {
      setCountdownValue(i);
      // Wait but check for pause every 100ms
      for (let j = 0; j < 10; j++) {
        if (isPausedRef.current) {
          // Wait until unpaused
          while (isPausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    setCountdownValue("START!");
    // Wait for START but also check for pause
    for (let j = 0; j < 5; j++) {
      if (isPausedRef.current) {
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setShowCountdown(false);
  }

  // Typing logic
  useEffect(() => {
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

  // Key listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (!gameActive) return;
      if (e.key.length === 1) {
        if (typed.length >= currentFact.length) return;
        setTyped(prev => prev + e.key);
      } else if (e.key === "Backspace") {
        setTyped(prev => prev.slice(0, -1));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, typed, currentFact]);

  return (
    <div className="speed-typing-game">
      {/* Hamburger button */}
      <button className="hamburger" onClick={() => {
        setIsMenuOpen(true);
        setIsPaused(true);
      }}>
        <span></span><span></span><span></span>
      </button>

      {/* Pause Menu Modal */}
      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => {
          setIsMenuOpen(false);
          setIsPaused(false);
        }}>
          <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-buttons">
              <button className="menu-btn resume-btn" onClick={() => {
                setIsMenuOpen(false);
                setIsPaused(false);
              }}>Resume</button>
              <button className="menu-btn restart-btn" onClick={() => { 
                setIsMenuOpen(false); 
                setIsPaused(false);
                startGame(); 
              }}>Restart</button>
              <button className="menu-btn exit-btn" onClick={() => navigate("/")}>Exit</button>
            </div>
          </div>
        </div>
      )}

      <div className="background-layer"></div>

      {/* GUIDE SCREENS */}
      {(step === 0 || step === 1) && (
        <div className="GuideContainer">
          {step === 0 && (
            <>
              <h1>Cat Speed Typing Adventure</h1>
              <p className="instructions">
                Type the cat fact as fast as you can! The faster you type correctly,
                the further the cat runs toward the goal
              </p>
              <div className="controls">
                <button onClick={() => setStep(1)}>Next</button>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="difficulty-selector"
                >
                  <option value="easy">Easy (45s)</option>
                  <option value="medium">Medium (30s)</option>
                  <option value="hard">Hard (20s)</option>
                </select>
                <button className="start-btn" onClick={startFreshGame}>Start Game</button>
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
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="difficulty-selector"
                >
                  <option value="easy">Easy (45s)</option>
                  <option value="medium">Medium (30s)</option>
                  <option value="hard">Hard (20s)</option>
                </select>
                <button className="start-btn" onClick={startFreshGame}>Start Game</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* GAME SCREEN */}
      {step === 2 && (
        <div className="GameContainer">
          {/* Difficulty Display */}
          <div className="difficulty-display">
            <span className="difficulty-text">
              Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} 
              ({getDifficultyTime(difficulty)}s)
            </span>
          </div>
          
          <div className="game-area">
            <div className={`track ${gameActive ? "active" : ""} ${isPaused ? "paused" : ""} ${showCountdown ? "countdown" : ""}`}>
              {/* Countdown Overlay */}
              {showCountdown && (
                <div className="countdown-overlay">
                  <div className="countdown-text">{countdownValue}</div>
                </div>
              )}
              {/* Timer circle */}
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

              {/* Track */}
              <div className="bg-static gif"></div>
              <div className="bg-layer bg3"></div>
              <div className="bg-layer bg1"></div>
              <div className="bg-layer bg2"></div>
              <div className="road"></div>
              <div className="bushes"></div>
              <div className="foreground-layer"></div>

              {/* Cat */}
              <img
                src="images/catwalk.gif"
                alt="Cat"
                className="cat"
                style={{ left: catMovable ? `${progress}%` : `${prevCatPosition}%` }}
              />

              {/* Progress line */}
              <div className="progress-line">
                <div
                  className="tracker-cat"
                  style={{ left: catMovable ? `${progress}%` : `${prevCatPosition}%` }}
                ></div>
                <div className="line-end">🏁</div>
              </div>
            </div>

            {/* Fact box */}
            <div className="fact-box">
              {(currentFact && typeof currentFact === 'string' ? currentFact : 'Press "Start Game" to begin!').split("").map((char, idx) => {
                let cls = "untyped-char";
                if (idx < typed.length) cls = typed[idx] === char ? "typed-char" : "wrong-char";
                return <span key={idx} className={cls}>{char}</span>;
              })}
            </div>


          </div>

          {/* End modal */}
          {modalOpen && (
            <div className="modal-overlay">
              <div className="end-modal-content">
                <h2>{result.includes("Congratulations") ? "You Won!" : "You Lost!"}</h2>
                <p>{currentFact}</p>
                <button className="start-btn" onClick={startGame}>
                  {result.includes("Congratulations") ? "Next Fact" : "Try Again"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
